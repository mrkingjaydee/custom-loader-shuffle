import asyncio
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('shuffle_backend', Path(__file__).resolve().parents[1] / 'main.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class BackendTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        m.ROOT = self.root / 'Custom Loader'
        self.folder = m.ROOT / 'images' / 'Add Your GIFs Here'
        self.folder.mkdir(parents=True)
        self.config = m.ROOT / 'config_USER.json'
        self.original = {'active': True, 'Choose Loader': {'value': 'Custom', 'components': {'Custom Image': 'old.gif', 'Scale': 2}}}
        self.config.write_text(json.dumps(self.original))
        self.settings = self.root / 'settings'
        self.settings.mkdir()
        old = os.environ.get('DECKY_PLUGIN_SETTINGS_DIR')
        os.environ['DECKY_PLUGIN_SETTINGS_DIR'] = str(self.settings)
        self.addCleanup(lambda: os.environ.pop('DECKY_PLUGIN_SETTINGS_DIR', None) if old is None else os.environ.__setitem__('DECKY_PLUGIN_SETTINGS_DIR', old))
        self.plugin = m.Plugin()

    async def test_selection_and_backup(self):
        (self.folder / 'b.gif').write_bytes(b'GIF89a')
        (self.folder / 'A.GIF').write_bytes(b'GIF89a')
        self.assertEqual(await self.plugin.list_gifs(), ['A.GIF', 'b.gif'])
        await self.plugin.write_selection('b.gif')
        await self.plugin.write_selection('A.GIF')
        self.assertTrue((await self.plugin.read_selection())['image'].endswith('/A.GIF'))
        self.assertEqual(json.loads(self.config.read_text())['Choose Loader']['components']['Scale'], 2)
        self.assertEqual(json.loads((m.ROOT / 'config_USER.shuffle-backup.json').read_text()), self.original)

    async def test_symlinks_and_traversal(self):
        outside = self.root / 'outside.gif'
        outside.write_bytes(b'original')
        (self.folder / 'link.gif').symlink_to(outside)
        self.assertEqual(await self.plugin.list_gifs(), [])
        for name in ['link.gif', '../outside.gif', '/outside.gif']:
            with self.assertRaises(ValueError): await self.plugin.write_selection(name)
        (self.folder / 'valid.gif').write_bytes(b'GIF89a')
        self.config.unlink(); self.config.symlink_to(outside)
        with self.assertRaises(OSError): await self.plugin.write_selection('valid.gif')
        self.assertEqual(outside.read_bytes(), b'original')

    async def test_backup_symlink(self):
        outside = self.root / 'outside'
        outside.write_text('untouched')
        (m.ROOT / 'config_USER.shuffle-backup.json').symlink_to(outside)
        (self.folder / 'a.gif').write_bytes(b'GIF89a')
        await self.plugin.write_selection('a.gif')
        self.assertEqual(outside.read_text(), 'untouched')

    async def test_preferences(self):
        self.assertIsNone(await self.plugin.load_preferences())
        self.assertEqual(await self.plugin.save_preferences(False, 'random'), {'enabled':False,'mode':'random'})
        self.assertEqual(await m.Plugin().load_preferences(), {'enabled':False,'mode':'random'})
        with self.assertRaises(ValueError): await self.plugin.save_preferences(1, 'random')

    async def test_dependency(self):
        self.assertTrue((await self.plugin.dependency_status())['ready'])
        self.config.unlink()
        self.assertFalse((await self.plugin.dependency_status())['ready'])

    async def test_concurrent_config(self):
        with m.directory(m.ROOT) as fd:
            _, old, _ = m.read_json(fd, 'config_USER.json')
            self.config.write_text('{"changed":true}')
            with self.assertRaises(RuntimeError): m.atomic_json(fd, 'config_USER.json', {}, old)
        self.assertEqual(json.loads(self.config.read_text()), {'changed':True})

if __name__ == '__main__': unittest.main()
