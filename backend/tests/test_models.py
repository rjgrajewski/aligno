import pytest
from pydantic import ValidationError

from backend.models import MAX_PROFILE_PICTURE_LENGTH, UserProfile


def test_user_profile_accepts_reasonable_profile_picture_payload():
    payload = "data:image/jpeg;base64," + ("a" * (MAX_PROFILE_PICTURE_LENGTH - 23))

    profile = UserProfile(
        first_name="Ada",
        last_name="Lovelace",
        profile_picture=payload,
    )

    assert profile.profile_picture == payload


def test_user_profile_rejects_oversized_profile_picture_payload():
    payload = "a" * (MAX_PROFILE_PICTURE_LENGTH + 1)

    with pytest.raises(ValidationError) as exc_info:
        UserProfile(
            first_name="Ada",
            last_name="Lovelace",
            profile_picture=payload,
        )

    assert exc_info.value.errors()[0]["loc"] == ("profile_picture",)
