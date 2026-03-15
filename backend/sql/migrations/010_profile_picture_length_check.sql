ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_profile_picture_length_check;

ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_profile_picture_length_check
CHECK (profile_picture IS NULL OR char_length(profile_picture) <= 500000) NOT VALID;
