import sys
import pytest


def test_jwt_secret_required_raises_without_env(monkeypatch):
    monkeypatch.delenv("JWT_SECRET", raising=False)
    sys.modules.pop("backend.api.auth_utils", None)

    with pytest.raises(RuntimeError, match="JWT_SECRET environment variable is required"):
        import backend.api.auth_utils  # noqa: F401


def test_jwt_secret_loads_when_env_set(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret-value")
    sys.modules.pop("backend.api.auth_utils", None)

    import backend.api.auth_utils as auth_utils_module

    assert auth_utils_module.JWT_SECRET == "test-secret-value"
