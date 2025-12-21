package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile,String> {

    // Find UserProfile by associated User's username
    @Query("SELECT up FROM user_profiles up WHERE up.user.email = :email")
    Optional<UserProfile> findByUsername(@Param("email") String email);
}
