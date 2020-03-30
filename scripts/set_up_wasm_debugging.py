import subprocess, pdb, os, sys, shutil, pathlib
from abc import ABC, abstractmethod

class Setup(ABC):
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
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=dir, shell=shell)
        while True:
            line = process.stdout.readline()
            if process.poll() is not None:
                break
            if line:
                print(line.strip())

        if process.returncode:
            print("Failed executing command " + cmd)
            sys.exit()

    def _clone_repository(self, options):
        repo_dir = os.path.join(self._install_dir, self._project_name)
        print("Cloning " + repo_dir + "..")
        if (os.path.isdir(os.path.join(repo_dir))):
            return
        cmd = ["git", "clone", "--depth", "1"]
        cmd.extend(options)
        cmd.append(self._url)
        Setup._run_command(cmd, self._install_dir)

class OpenCVSetup(Setup):
    def __init__(self, install_dir):
        super().__init__(install_dir, "https://github.com/opencv/opencv.git", "opencv")

    def initialize(self):
        options = ["-b", "master"]
        super()._clone_repository(options)

    def build(self):
        print("Setting up OpenCV..")
        cmd = 'EMMAKEN_CFLAGS=\'-s SINGLE_FILE=0\' '\
            'emmake python ./platforms/js/build_js.py --build_wasm build_wasm '\
            '--build_flags=\'-g -s SINGLE_FILE=0\' '\
            '--threads --emscripten_dir=$EMSDK/upstream/emscripten'
        Setup._run_command(cmd, os.path.join(self._install_dir, self._project_name), True)

    def get_bin_dir(self):
        return os.path.join(self._install_dir, self._project_name, "build_wasm/bin")

class LLVMSetup(Setup):
    def __init__(self, install_dir):
        super().__init__(install_dir, "https://github.com/v8/llvm-project", "llvm-project")

    def build(self):
        print("Setting up LLVM..")
        build_path = os.path.join(self._install_dir, self._project_name, 'build')
        create_dir(build_path)
        cmd = 'cmake ../llvm -DLLVM_ENABLE_PROJECTS=\'lldb;lld;clang;clang-tools-extra;libcxx\' '\
            '-DCMAKE_BUILD_TYPE=Release'
        Setup._run_command(cmd, build_path, True)

        cmd = 'make -j 2 lldb-cdlc'
        Setup._run_command(cmd, build_path, True)

        cmd = 'make -j 2 check-lldb-cdlc'
        Setup._run_command(cmd, build_path, True)

    def initialize(self):
        options = ["-b", "devtools-backend"]
        super()._clone_repository(options)

class WebCameraSetup(Setup):
    def __init__(self, install_dir, opencv_bin_dir):
        super().__init__(install_dir, "https://github.com/riju/WebCamera", "WebCamera")
        self._opencv_bin_dir = opencv_bin_dir

    def build(self):
        print("Setting up WebCamera..")
        dest = os.path.join(self._install_dir, self._project_name, "build/wasm/desktop")
        for file in os.listdir(self._opencv_bin_dir):
            if file.startswith('opencv'):
                 shutil.copy2(os.path.join(self._opencv_bin_dir, file), os.path.join(dest, file))

    def initialize(self):
        options = []
        super()._clone_repository(options)

def get_default_config():
    config = {}
    current_dir = pathlib.Path(__file__).parent.absolute()
    config["install_dir"] = os.path.join(current_dir, "language-components-test")
    return config

def create_dir(directory):
    if not os.path.exists(directory):
        os.mkdir(directory)

def setup_projects(config):
    create_dir(config["install_dir"])
    llvm_setup = LLVMSetup(config["install_dir"])
    opencv_setup = OpenCVSetup(config["install_dir"])
    webcam_setup = WebCameraSetup(config["install_dir"], opencv_setup.get_bin_dir())

    projects = [opencv_setup, llvm_setup, webcam_setup]
    for project in projects:
        project.initialize()
        project.build()

def main():
    config = get_default_config()
    setup_projects(config)

if __name__ == "__main__":
    main()
