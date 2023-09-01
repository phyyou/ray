import os

from ci.ray_ci.container import Container, _DOCKER_ECR_REPO
from ci.ray_ci.build_container import PYTHON_VERSIONS
from ci.ray_ci.utils import docker_pull

PLATFORM = [
    "cu118",
    "gpu",
]


class DockerContainer(Container):
    def __init__(self, python_version: str, platform: str) -> None:
        super().__init__(
            "forge",
            volumes=[
                f"{os.environ['RAYCI_CHECKOUT_DIR']}:/rayci",
                "/var/run/docker.sock:/var/run/docker.sock",
            ],
        )
        self.python_version = python_version
        self.platform = platform

    def run(self) -> None:
        base_image = (
            f"{_DOCKER_ECR_REPO}:{os.environ['RAYCI_BUILD_ID']}"
            f"-ray{self.python_version}{self.platform}base"
        )
        docker_pull(base_image)
        wheel_name = (
            "ray-3.0.0.dev0-"
            f"{PYTHON_VERSIONS[self.python_version][0]}-"
            "manylinux2014_x86_64.whl"
        )
        constraints_file = (
            "requirements_compiled_py37.txt"
            if self.python_version == "py37"
            else "requirements_compiled.txt"
        )
        ray_repo = "rayproject/ray-ml" if self.platform == "gpu" else "rayproject/ray"
        ray_image = (
            f"{ray_repo}:"
            f"{os.environ['BUILDKITE_COMMIT'][:6]}-"
            f"{self.python_version}-{self.platform}"
        )
        self.run_script(
            f"""
            ./ci/build/build-ray-docker.sh \
              {wheel_name} {base_image} {constraints_file} {ray_image}
            """
        )
