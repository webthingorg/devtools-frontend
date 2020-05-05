import subprocess, subprocess, os, shutil, pathlib, sys
from abc import ABC, abstractmethod

LLVM_PROJECT_NAME = "CXXDWARFSymbols"
LLVM_REPOSITORY = "https://github.com/v8/llvm-project"

OPENCV_PROJECT_NAME = "opencv"
OPENCV_REPOSITORY = "https://github.com/opencv/opencv.git"

WEBCAMERA_PROJECT_NAME = "WebCamera"
WEBCAMERA_REPOSITORY = "https://github.com/riju/WebCamera"
DEVTOOLS_PROJECT_NAME = "devtools"


class Project(ABC):
    def __init__(self, install_dir, url, project_name):
        self._install_dir = install_dir
        self._url = url
        self._project_name = project_name

    @abstractmethod
    def initialize():
        pass

    @abstractmethod
    def build():
        pass

    @staticmethod
    def _run_command(cmd, dir, shell=False):
        print("Command:")
        print(cmd)
        process = subprocess.Popen(cmd,
                                   stdout=subprocess.PIPE,
                                   stderr=subprocess.STDOUT,
                                   cwd=dir,
                                   shell=shell)
        while True:
            line = process.stdout.readline()
            if process.poll() is not None:
                break
            if line:
                print(line.strip())

        if process.returncode:
            print("ERROR: Failed executing command:")
            print(cmd)
            sys.exit(1)

    def _pull(self, path, branch):
        cmd = ["git", "pull", "origin", branch]
        Project._run_command(cmd, path)

    def _clone_repository(self, branch="master"):
        repo_dir = os.path.join(self._install_dir, self._project_name)
        if (os.path.isdir(repo_dir)):
            print("Pulling latest changes..")
            self._pull(repo_dir, branch)
            return
        print("Cloning " + repo_dir + "..")
        cmd = ["git", "clone", "--depth", "1"]
        if branch:
            cmd.extend(["-b", branch])
        cmd.append(self._url)
        Project._run_command(cmd, self._install_dir)


class LLVMProject(Project):
    def __init__(self, install_dir):
        project_path = os.path.join(install_dir, "devtools/devtools-frontend")
        print(project_path)
        super().__init__(project_path, "", LLVM_PROJECT_NAME)

    def _update_deps(self):
        deps_file = os.path.join(self._install_dir, "DEPS")
        with open(deps_file, 'r') as f:
            deps_content = f.read()
        with open(deps_file, 'w') as f:
            f.write(
                deps_content.replace("'build_symbol_server': False",
                                     "'build_symbol_server': True"))

    def initialize(self):
        # Change DEPS to pull llvm
        self._update_deps()

        # Pull llvm and emscripten
        cmd = ["gclient", "sync"]
        Project._run_command(cmd, self._install_dir)

    def build(self):
        print("Setting up Language Server..")
        build_path = os.path.join(self._install_dir, "back_end",
                                  self._project_name, "build")
        create_dir(build_path)
        cmd = [
            "cmake", "-DSYMBOL_SERVER_BUILD_FORMATTERS=ON",
            "-DLLDB_INCLUDE_TESTS=OFF", "-GNinja", ".."
        ]
        # For goma
        # "-DCMAKE_CXX_COMPILER_LAUNCHER=/Users/kimanh/work/depot_tools/.cipd_bin/gomacc",
        # "-DCMAKE_C_COMPILER_LAUNCHER=/Users/kimanh/work/depot_tools/.cipd_bin/gomacc",
        # "-DCMAKE_C_COMPILER=/Users/kimanh/work/v8/third_party/llvm-build/Release+Asserts/bin/clang",
        # "-DCMAKE_CXX_COMPILER=/Users/kimanh/work/v8/third_party/llvm-build/Release+Asserts/bin/clang++",

        Project._run_command(cmd, build_path)

        cmd = ["autoninja"]
        Project._run_command(cmd, build_path)

    def run(self, search_path, timeout):
        project_path = os.path.join(self._install_dir, "back_end",
                                    self._project_name)
        starter_script = os.path.join(project_path, "tools/symbol-server.py")
        language_server = os.path.join(project_path,
                                       "build/bin/DWARFSymbolServer")
        cmd = [starter_script, language_server, "-I", search_path]
        print(' '.join(cmd))

        if timeout > 0:
            subprocess.run(cmd, timeout=timeout)
        else:
            subprocess.run(cmd)


class DevtoolsProject(Project):
    def __init__(self, install_dir):
        super().__init__(install_dir, "", "devtools")

    def initialize(self):
        project_path = os.path.join(self._install_dir, DEVTOOLS_PROJECT_NAME)
        checkout_path = os.path.join(project_path, "devtools-frontend")
        if os.path.exists(checkout_path):
            super()._pull(checkout_path, "master")
            return
        create_dir(project_path)
        cmd = ["fetch", "devtools-frontend"]
        Project._run_command(cmd, project_path)

    def build(self):
        print("Setting up DevTools..")
        project_path = os.path.join(self._install_dir, self._project_name,
                                    "devtools-frontend")
        cmd = ["gn", "gen", "out/Release"]
        Project._run_command(cmd, project_path)

        cmd = ["autoninja", "-C", "out/Release"]
        Project._run_command(cmd, project_path)

    def run(self):
        project_path = os.path.join(self._install_dir, self._project_name,
                                    "devtools-frontend")
        os.environ["WITH_SYMBOL_SERVER"] = "True"
        cmd = ["npm", "run", "e2etest"]
        Project._run_command(cmd, project_path)


class WebCameraProject(Project):
    def __init__(self, install_dir, opencv_bin_dir):
        super().__init__(install_dir, WEBCAMERA_REPOSITORY,
                         WEBCAMERA_PROJECT_NAME)
        self._opencv_bin_dir = opencv_bin_dir

    def build(self):
        print("Setting up WebCamera..")
        dest = os.path.join(self._install_dir, self._project_name,
                            "build/wasm/desktop")
        for file in os.listdir(self._opencv_bin_dir):
            if file.startswith('opencv'):
                shutil.copy2(os.path.join(self._opencv_bin_dir, file),
                             os.path.join(dest, file))

    def initialize(self):
        super()._clone_repository()

    def run(self):
        project_path = os.path.join(self._install_dir, self._project_name)
        print(project_path)
        cmd = ["python3", "-m", "http.server", "8000", "--bind", "127.0.0.1"]
        Project._run_command(cmd, project_path)


class OpenCVProject(Project):
    def __init__(self, install_dir):
        super().__init__(install_dir, OPENCV_REPOSITORY, OPENCV_PROJECT_NAME)

    def initialize(self):
        super()._clone_repository()

    def build(self):
        print("Setting up OpenCV..")
        cmd = 'EMMAKEN_CFLAGS=\'-s SINGLE_FILE=0\' '\
            'emmake python ./platforms/js/build_js.py --build_wasm build_wasm '\
            '--build_flags=\'-g -s SINGLE_FILE=0\' '\
            '--threads --emscripten_dir=$EMSDK/upstream/emscripten'
        Project._run_command(
            cmd, os.path.join(self._install_dir, self._project_name), True)

    def get_bin_dir(self):
        return os.path.join(self._install_dir, self._project_name,
                            "build_wasm/bin")


def run_language_server(language_server_project, search_path, timeout=0):
    try:
        print("Starting server")
        language_server_project.run(search_path, timeout)
    except subprocess.TimeoutExpired as ex:
        print("Language Server timed out.")
    except Exception as ex:
        print("Language Server was shut down unexpectedly.")
        print(ex)
    print("Shutting down Language Server")


def get_default_config():
    config = {}
    current_dir = pathlib.Path(__file__).parent.absolute()
    config["install_dir"] = os.path.join(current_dir,
                                         "language-components-test")
    return config


def create_dir(directory):
    if not os.path.exists(directory):
        os.mkdir(directory)
