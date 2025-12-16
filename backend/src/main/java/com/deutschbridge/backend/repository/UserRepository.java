package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.User;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User,String> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.tokenValue = u.tokenValue + 1 WHERE u.email = :email")
    int incrementTokenValue(@Param("email") String email);

    @Query("SELECT u.tokenValue FROM User u WHERE u.email = :email")
    int getTokenValue(@Param("email") String email);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.refreshToken = :refreshToken WHERE u.email = :email")
    void saveRefreshToken(@Param("email") String email, @Param("refreshToken") String refreshToken);

    void deleteByEmail(String email);
}
