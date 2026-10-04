-- FeatureType gained AI_WRITING_FEEDBACK (Schreiben AI feedback now has its own daily limit instead of
-- sharing AI_CORRECTION). If the baseline schema carries Hibernate's generated CHECK on the enum column,
-- it would reject the new value; the Java enum + ddl-auto=validate already guard it (see V5).
ALTER TABLE feature_limits DROP CONSTRAINT IF EXISTS feature_limits_feature_type_check;
ALTER TABLE feature_usages DROP CONSTRAINT IF EXISTS feature_usages_feature_type_check;
