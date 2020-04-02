import subprocess, pdb, os, sys, shutil, pathlib, threading
from abc import ABC, abstractmethod

LLVM_PROJECT_NAME = "llvm-project"
OPENCV_PROJECT_NAME = "opencv"
WEBCAMERA_PROJECT_NAME = "WebCamera"
DEVTOOLS_PROJECT_NAME = "devtools"

class Setup(ABC):
    def __init__(self, install_dir, url, project_name):
        self._install_dir = install_dir
        self._url = url
        self._project_name = project_name
        self._built = False

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
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, cwd=dir, shell=shell)
        while True:
            line = process.stdout.readline()
            if process.poll() is not None:
                break
            if line:
                print(line.strip())

        if process.returncode:
            print("Failed executing command:")
            print(cmd)
            sys.exit()

    def _clone_repository(self, options):
        repo_dir = os.path.join(self._install_dir, self._project_name)
        print("Cloning " + repo_dir + "..")
        if (os.path.isdir(repo_dir)):
            return
        cmd = ["git", "clone", "--depth", "1"]
        cmd.extend(options)
        cmd.append(self._url)
        Setup._run_command(cmd, self._install_dir)

class OpenCVSetup(Setup):
    def __init__(self, install_dir):
        super().__init__(install_dir, "https://github.com/opencv/opencv.git", OPENCV_PROJECT_NAME)

    def initialize(self):
        options = ["-b", "master"]
        super()._clone_repository(options)

    def build(self):
        if self._built:
            return
        print("Setting up OpenCV..")
        cmd = 'EMMAKEN_CFLAGS=\'-s SINGLE_FILE=0\' '\
            'emmake python ./platforms/js/build_js.py --build_wasm build_wasm '\
            '--build_flags=\'-g -s SINGLE_FILE=0\' '\
            '--threads --emscripten_dir=$EMSDK/upstream/emscripten'
        Setup._run_command(cmd, os.path.join(self._install_dir, self._project_name), True)
        self._built = True

    def get_bin_dir(self):
        return os.path.join(self._install_dir, self._project_name, "build_wasm/bin")

class LLVMSetup(Setup):
    def __init__(self, install_dir):
        super().__init__(install_dir, "https://github.com/v8/llvm-project", LLVM_PROJECT_NAME)

    def build(self):
        if self._built:
            return

        print("Setting up LLVM..")
        build_path = os.path.join(self._install_dir, self._project_name, 'build')
        cmd = 'cmake ../llvm -DLLVM_ENABLE_PROJECTS=\'lldb;lld;clang;clang-tools-extra;libcxx\' '\
            '-DCMAKE_BUILD_TYPE=Release'
        Setup._run_command(cmd, build_path, True)

        cmd = 'make -j 2 lldb-cdlc'
        Setup._run_command(cmd, build_path, True)

        cmd = 'make -j 2 check-lldb-cdlc'
        Setup._run_command(cmd, build_path, True)

        self._built = True

    def initialize(self):
        project_path = os.path.join(self._install_dir, self._project_name)
        cmd = ['fetch', 'devtools-frontend']
        if os.path.isdir(project_path):
            return
        create_dir(project_path)
        Setup._run_command(cmd, project_path)
        
    def run(self, path_to_replace, new_path):
        project_path = "/Users/kimanh/work/other/llvm-project" #os.path.join(self._install_dir, self._project_name)
        webcam_path = os.path.join(self._install_dir, "WebCamera/build/wasm/desktop")
        cdlc_server_start = "lldb/tools/lldb-cdlc/tools/cdlc-server"
        cdlc_server_binary = "build/bin/lldb-cdlc"
        localhost_url = "http://localhost:8000/"
        path_substitution = localhost_url + "=" + webcam_path
        cmd = [cdlc_server_start, cdlc_server_binary, "-path-subst", path_substitution]
        Setup._run_command(' '.join(cmd), project_path, True)

    def getBuildDir(self):
        return os.path.join(self._install_dir, self._project_name, "build")

class DevtoolsSetup(Setup):
    def __init__(self, install_dir):
        super().__init__(install_dir, "", "devtools")

    def initialize(self):
        project_path = os.path.join(self._install_dir, DEVTOOLS_PROJECT_NAME)
        if os.path.exists(project_path):
            return
        create_dir(project_path)
        cmd = ["fetch", self._project_name]
        Setup._run_command(cmd, project_path)

    def build(self):
        if self._built:
            return
        print("Setting up DevTools..")
        project_path = os.path.join(self._install_dir, self._project_name, "devtools-frontend")
        cmd = ["gn", "gen", "out/Release"]
        Setup._run_command(cmd, project_path)
        self._built = True

class WebCameraSetup(Setup):
    def __init__(self, install_dir, opencv_bin_dir):
        super().__init__(install_dir, "https://github.com/riju/WebCamera", WEBCAMERA_PROJECT_NAME)
        self._opencv_bin_dir = opencv_bin_dir

    def build(self):
        if self._built:
            return

        print("Setting up WebCamera..")
        dest = os.path.join(self._install_dir, self._project_name, "build/wasm/desktop")
        for file in os.listdir(self._opencv_bin_dir):
            if file.startswith('opencv'):
                 shutil.copy2(os.path.join(self._opencv_bin_dir, file), os.path.join(dest, file))
        self._built = True

    def initialize(self):
        options = []
        super()._clone_repository(options)

    def run(self):
        project_path = os.path.join(self._install_dir, self._project_name)
        print(project_path)
        cmd = ["python3", "-m", "http.server", "8000", "--bind", "127.0.0.1"]
        Setup._run_command(cmd, project_path)

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
    #devtools_setup = DevtoolsSetup(config["install_dir"])

    projects = [llvm_setup] #[devtools_setup, opencv_setup, llvm_setup, webcam_setup]
    for project in projects:
        project.initialize()
        #project.build()

    config['llvm_setup'] = llvm_setup
    config['webcamera_setup'] = webcam_setup

def run_language_server(language_server_setup):
    try:
        print("Starting server")
        language_server_setup.run("","")
    except Exception as ex:
        print("Language Server was shut down unexpectedly.")
        print(ex)
        return
    print("Shutting down Language Server")

def run_webcamera_server(webcamera_setup):
    print("Starting WebCam Server..")
    try:
        webcamera_setup.run()
    except Exception as ex:
        print("Webcam Server was shut down unexpectedly.")
        print(ex)
    print("Shutting down Webcam Server")

def run_e2e_test():
    pass

def print_info(info):
    separator = "============================\n============================"
    print(separator)
    print(info)
    print(separator)

def run_language_server_test(config):
    language_server = threading.Thread(target=run_language_server, args=(config["llvm_setup"],))
    webcamera_server = threading.Thread(target=run_webcamera_server, args=(config["webcamera_setup"],))
    language_server.start()
    webcamera_server.start()

    print_info("Inspect OpenCV.js by opening http://localhost:8000/")
    
    language_server.join()
    webcamera_server.join()
                                       
    #run_e2e_test()

def main():
    config = get_default_config()
    setup_projects(config)
    run_language_server_test(config)

if __name__ == "__main__":
    main()
