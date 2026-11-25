from pathlib import Path
from contextlib import contextmanager
import json
import os
import stat
import secrets
import logging

ROOT = Path('/home/deck/homebrew/themes/Custom Loader')
LOG = logging.getLogger('CustomLoaderShuffle')
MAX_JSON = 2 * 1024 * 1024

@contextmanager
def directory(path):
    # Pin each directory, rejecting symlinks at every level.
    path = Path(path)
    if not path.is_absolute() or '..' in path.parts:
        raise ValueError('Unsafe directory path')
    flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
    fd = os.open('/', flags)
    try:
        for part in path.parts[1:]:
            child = os.open(part, flags, dir_fd=fd)
            os.close(fd)
            fd = child
        yield fd
    finally:
        os.close(fd)


def read_json(fd, name):
    f = os.open(name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=fd)
    with os.fdopen(f, 'rb') as stream:
        meta = os.fstat(stream.fileno())
        if not stat.S_ISREG(meta.st_mode) or meta.st_nlink != 1 or meta.st_size > MAX_JSON:
            raise ValueError('Unsafe configuration file')
        raw = stream.read(MAX_JSON + 1)
        if len(raw) > MAX_JSON:
            raise ValueError('Configuration too large')
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError('Invalid configuration')
    return data, meta, raw


def signature(meta):
    return (meta.st_dev, meta.st_ino, meta.st_size, meta.st_mtime_ns, meta.st_ctime_ns)


def atomic_json(fd, name, data, previous=None, owner=None, exclusive=False):
    tmp = '.shuffle-' + secrets.token_hex(16)
    f = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=fd)
    try:
        with os.fdopen(f, 'w', encoding='utf-8') as stream:
            json.dump(data, stream, ensure_ascii=False)
            stream.flush()
            meta = previous if previous is not None else owner
            if meta is not None and os.geteuid() == 0:
                os.fchown(stream.fileno(), meta.st_uid, meta.st_gid)
            if previous is not None:
                os.fchmod(stream.fileno(), stat.S_IMODE(previous.st_mode) & 0o777)
            os.fsync(stream.fileno())
        if exclusive:
            # Never overwrite an existing backup, even if it is a link.
            os.link(tmp, name, src_dir_fd=fd, dst_dir_fd=fd, follow_symlinks=False)
        else:
            if previous is not None:
                latest = os.stat(name, dir_fd=fd, follow_symlinks=False)
                if signature(latest) != signature(previous):
                    raise RuntimeError('Configuration changed concurrently; retry')
            os.replace(tmp, name, src_dir_fd=fd, dst_dir_fd=fd)
    finally:
        try:
            os.unlink(tmp, dir_fd=fd)
        except FileNotFoundError:
            pass


class Plugin:
    async def _main(self):
        pass

    async def _unload(self):
        pass

    def _settings_path(self):
        return Path(os.environ['DECKY_PLUGIN_SETTINGS_DIR'])

    async def load_preferences(self):
        with directory(self._settings_path()) as fd:
            try:
                data, _, _ = read_json(fd, 'preferences.json')
            except FileNotFoundError:
                return None
        if type(data.get('enabled')) is not bool or data.get('mode') not in ('random', 'sequential'):
            raise ValueError('Invalid saved preferences')
        return {'enabled': data['enabled'], 'mode': data['mode']}

    async def save_preferences(self, enabled, mode):
        if type(enabled) is not bool or mode not in ('random', 'sequential'):
            raise ValueError('Invalid preferences')
        with directory(self._settings_path()) as fd:
            try:
                _, previous, _ = read_json(fd, 'preferences.json')
            except FileNotFoundError:
                previous = None
            atomic_json(fd, 'preferences.json', {'enabled': enabled, 'mode': mode}, previous, os.fstat(fd))
        return await self.load_preferences()

    async def dependency_status(self):
        try:
            config = await self.read_selection()
            if not config['active'] or config['patch'] != 'Custom':
                return {'ready': False, 'message': 'Enable Custom Loader and select Custom in CSS Loader.'}
            await self.list_gifs()
        except (OSError, ValueError, KeyError, TypeError):
            return {'ready': False, 'message': 'Install and enable Custom Loader in CSS Loader; check its GIF folder.'}
        return {'ready': True, 'message': 'Custom Loader ready. CSS Loader connection checked on apply.'}

    async def list_gifs(self):
        with directory(ROOT / 'images' / 'Add Your GIFs Here') as fd:
            names = []
            for name in os.listdir(fd):
                if not name.lower().endswith('.gif'):
                    continue
                try:
                    meta = os.stat(name, dir_fd=fd, follow_symlinks=False)
                except FileNotFoundError:
                    continue
                if stat.S_ISREG(meta.st_mode) and meta.st_nlink == 1:
                    names.append(name)
            return sorted(names, key=str.casefold)

    async def read_selection(self):
        with directory(ROOT) as fd:
            data, _, _ = read_json(fd, 'config_USER.json')
        return {'active': data.get('active'), 'patch': data['Choose Loader']['value'], 'image': data['Choose Loader']['components']['Custom Image']}

    async def write_selection(self, filename):
        if not isinstance(filename, str) or filename not in await self.list_gifs():
            raise ValueError('GIF not found in theme folder')
        with directory(ROOT) as fd:
            data, previous, _ = read_json(fd, 'config_USER.json')
            if not data.get('active') or data['Choose Loader']['value'] != 'Custom':
                raise ValueError('Enable Custom Loader and choose Custom first')
            components = data['Choose Loader']['components']
            old = components['Custom Image']
            new = 'Custom Loader/images/Add Your GIFs Here/' + filename
            try:
                atomic_json(fd, 'config_USER.shuffle-backup.json', data, owner=previous, exclusive=True)
            except FileExistsError:
                pass
            components['Custom Image'] = new
            atomic_json(fd, 'config_USER.json', data, previous)
            check, _, _ = read_json(fd, 'config_USER.json')
            if check['Choose Loader']['components']['Custom Image'] != new:
                raise RuntimeError('Config verification failed')
        return {'image': new, 'previous': old}
