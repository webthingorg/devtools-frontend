import subprocess, pdb, os, sys, shutil, pathlib, threading
from abc import ABC, abstractmethod

LLVM_PROJECT_NAME = "llvm-project"
OPENCV_PROJECT_NAME = "opencv"
WEBCAMERA_PROJECT_NAME = "WebCamera"
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
            sys.exit(1)

    def _pull(self, path, branch):
        cmd = ["git", "pull", "origin", branch]
        Project._run_command(cmd, path)

    def _clone_repository(self, branch = "master"):
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

class OpenCVProject(Project):
    def __init__(self, install_dir):
        super().__init__(install_dir, "https://github.com/opencv/opencv.git", OPENCV_PROJECT_NAME)

    def initialize(self):
        super()._clone_repository()

    def build(self):
        print("Setting up OpenCV..")
        cmd = 'EMMAKEN_CFLAGS=\'-s SINGLE_FILE=0\' '\
            'emmake python ./platforms/js/build_js.py --build_wasm build_wasm '\
            '--build_flags=\'-g -s SINGLE_FILE=0\' '\
            '--threads --emscripten_dir=$EMSDK/upstream/emscripten'
        Project._run_command(cmd, os.path.join(self._install_dir, self._project_name), True)

    def get_bin_dir(self):
        return os.path.join(self._install_dir, self._project_name, "build_wasm/bin")

class LLVMProject(Project):
    def __init__(self, install_dir):
        super().__init__(install_dir, "https://github.com/v8/llvm-project", LLVM_PROJECT_NAME)

    def initialize(self):
        super()._clone_repository(options, "devtools-backend")

    def build(self):
        print("Setting up LLVM..")
        build_path = os.path.join(self._install_dir, self._project_name, 'build')
        cmd = 'cmake ../llvm -DLLVM_ENABLE_PROJECTS=\'lldb;lld;clang;clang-tools-extra;libcxx\' '\
            '-DCMAKE_BUILD_TYPE=Release'
        Project._run_command(cmd, build_path, True)

        cmd = 'make -j 2 lldb-cdlc'
        Project._run_command(cmd, build_path, True)

        #cmd = 'make -j 2 check-lldb-cdlc'
        #Project._run_command(cmd, build_path, True)
        
    def run(self, path_to_replace, new_path):
        project_path = os.path.join(self._install_dir, self._project_name)
        cdlc_server_start = "lldb/tools/lldb-cdlc/tools/cdlc-server"
        cdlc_server_binary = "build/bin/lldb-cdlc"
        path_substitution = path_to_replace + "=" + new_path
        cmd = [cdlc_server_start, cdlc_server_binary]
        if path_to_replace or new_path:
            cmd.extend(["-path-subst", path_substitution])
        Project._run_command(' '.join(cmd), project_path, True)

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
        project_path = os.path.join(self._install_dir, self._project_name, "devtools-frontend")
        cmd = ["gn", "gen", "out/Release"]
        Project._run_command(cmd, project_path)

        cmd = ["autoninja", "-C", "out/Release"]
        Project._run_command(cmd, project_path)

    def run(self):
        project_path = os.path.join(self._install_dir, self._project_name, "devtools-frontend")
        os.environ['WITH_SYMBOL_SERVER'] = ''
        cmd = ['npm', 'run', 'e2etest', '--test-file=test/e2e/sources/dwarf-cxx-language-plugin.ts']
        Project._run_command(cmd, project_path)

class WebCameraProject(Project):
    def __init__(self, install_dir, opencv_bin_dir):
        super().__init__(install_dir, "https://github.com/riju/WebCamera", WEBCAMERA_PROJECT_NAME)
        self._opencv_bin_dir = opencv_bin_dir

    def build(self):
        print("Setting up WebCamera..")
        dest = os.path.join(self._install_dir, self._project_name, "build/wasm/desktop")
        for file in os.listdir(self._opencv_bin_dir):
            if file.startswith('opencv'):
                 shutil.copy2(os.path.join(self._opencv_bin_dir, file), os.path.join(dest, file))

    def initialize(self):
        super()._clone_repository()

    def run(self):
        project_path = os.path.join(self._install_dir, self._project_name)
        print(project_path)
        cmd = ["python3", "-m", "http.server", "8000", "--bind", "127.0.0.1"]
        Project._run_command(cmd, project_path)

def get_default_config():
    config = {}
    current_dir = pathlib.Path(__file__).parent.absolute()
    config["install_dir"] = os.path.join(current_dir, "language-components-test")
    return config

def create_dir(directory):
    if not os.path.exists(directory):
        os.mkdir(directory)

def setup_projects(config):
    install_dir = config["install_dir"]
    create_dir(install_dir)
    llvm_project = LLVMProject(install_dir)
    opencv_project = OpenCVProject(install_dir)
    webcam_project = WebCameraProject(install_dir, opencv_project.get_bin_dir())
    devtools_project = DevtoolsProject(install_dir)

    projects = [devtools_project, opencv_project, webcam_project]#, llvm_project]
    for project in projects:
        project.initialize()
        project.build()

    config[LLVM_PROJECT_NAME] = llvm_project
    config[WEBCAMERA_PROJECT_NAME] = webcam_project
    config[DEVTOOLS_PROJECT_NAME] = devtools_project

def run_language_server(language_server_project, path_subst_origin, path_subst_target):
    try:
        print("Starting server")
        language_server_project.run(path_subst_origin, path_subst_target)
    except Exception as ex:
        print("Language Server was shut down unexpectedly.")
        print(ex)
        return
    print("Shutting down Language Server")

def run_webcamera_server(webcamera_project):
    print("Starting WebCam Server..")
    try:
        webcamera_project.run()
    except Exception as ex:
        print("Webcam Server was shut down unexpectedly.")
        print(ex)
    print("Shutting down Webcam Server")

def print_info(info):
    separator = "============================\n============================"
    print(separator)
    print(info)
    print(separator)

def run_open_cv_test(config):
    localhost_url = "http://localhost:8000/"
    webcam_url = os.path.join(config["install_dir", "WebCamera"])
    language_server = threading.Thread(target=run_language_server, args=(config[LLVM_PROJECT_NAME], localhost_url, webcam_url))
    webcamera_server = threading.Thread(target=run_webcamera_server, args=(config[WEBCAMERA_PROJECT_NAME],))
    language_server.start()
    webcamera_server.start()

    print_info("Inspect OpenCV.js by opening http://localhost:8000/")
    
    language_server.join()
    webcamera_server.join()
    
def run_e2e_test(config):
    localhost_url = "http://localhost:8090"
    devtools_url = os.path.join(config["install_dir"], "devtools", "devtools-frontend")
    language_server = threading.Thread(target=run_language_server, args=(config[LLVM_PROJECT_NAME], localhost_url, devtools_url))
    language_server.daemon = True
    language_server.start()

    # TODO: comment out as soon as e2e test is running correctly
    language_server.join()

    print("Starting e2e test..")
    config[DEVTOOLS_PROJECT_NAME].run()
    print("Done with e2e test")

def main():
    config = get_default_config()
    setup_projects(config)
    run_e2e_test(config)
    run_open_cv_language_server_test(config)
    
    # Language server will be killed when main program exits
    sys.exit()

if __name__ == "__main__":
    main()
