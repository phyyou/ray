import click

from ci.ray_ci.build_container import PYTHON_VERSIONS, BuildContainer
from ci.ray_ci.forge_container import ForgeContainer
from ci.ray_ci.docker_container import PLATFORM, DockerContainer
from ci.ray_ci.utils import logger


@click.command()
@click.argument(
    "artifact_type",
    required=True,
    type=click.Choice(["wheel", "docker"]),
)
@click.option(
    "--python-version",
    default="py38",
    type=click.Choice(list(PYTHON_VERSIONS.keys())),
    help=("Python version to build the wheel with"),
)
@click.option(
    "--platform",
    default="cu118",
    type=click.Choice(list(PLATFORM)),
    help=("Platform to build the docker with"),
)
def main(
    artifact_type: str,
    python_version: str,
    platform: str,
) -> None:
    """
    Build a wheel or jar artifact
    """
    if artifact_type == "wheel":
        logger.info(f"Building wheel for Python {python_version}")
        build_wheel(python_version)
        return

    if artifact_type == "docker":
        logger.info(f"Building ray for {python_version} and platform {platform}")
        build_docker(python_version, platform)
        return

    raise ValueError(f"Invalid artifact type {artifact_type}")


def build_wheel(python_version: str) -> None:
    """
    Build a wheel artifact
    """
    BuildContainer(python_version).run()
    ForgeContainer().upload_wheel()


def build_docker(python_version: str, platform: str) -> None:
    """
    Build a container artifact
    """
    BuildContainer(python_version).run()
    DockerContainer(python_version, platform).run()
