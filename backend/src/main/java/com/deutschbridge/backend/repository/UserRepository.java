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
    @Query("UPDATE User u SET u.accessTokenFlag = u.accessTokenFlag + 1 WHERE u.email = :email")
    int incrementAccessTokenFlag(@Param("email") String email);


    @Query("SELECT u.accessTokenFlag FROM User u WHERE u.email = :email")
     int getAccessTokenFlag(@Param("email") String email);

    default int incrementAndGetAccessTokenFlag(@Param("email") String email) {
        this.incrementAccessTokenFlag(email);
        return getAccessTokenFlag(email);
    }

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.refreshToken = :refreshToken WHERE u.email = :email")
    void saveRefreshToken(@Param("email") String email, @Param("refreshToken") String refreshToken);

    void deleteByEmail(String email);

}
