package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.AccountType;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User,String> {

    @Query("SELECT u FROM User u WHERE LOWER(u.email) = LOWER(:email) ORDER BY u.createdAt")
    List<User> findAllByEmailIgnoreCase(@Param("email") String email);

    /**
     * Case-insensitive lookup. If legacy data holds the same address in several casings, the account
     * stored with exactly the typed casing wins, otherwise the oldest one, so this never fails on duplicates.
     */
    default Optional<User> findByEmail(String email) {
        if (email == null) return Optional.empty();
        List<User> matches = findAllByEmailIgnoreCase(email.trim());
        return matches.stream().filter(u -> email.trim().equals(u.getEmail())).findFirst()
                .or(() -> matches.stream().findFirst());
    }

    @Query("SELECT COUNT(u) > 0 FROM User u WHERE LOWER(u.email) = LOWER(:email)")
    boolean existsByEmail(@Param("email") String email);

    List<User> findAllByDeletedFalse();

    List<User> findAllByDeletedTrue();

    long countByDeletedFalse();

    long countByDeletedFalseAndCreatedAtAfter(Instant after);

    long countByDeletedFalseAndAccountType(AccountType accountType);

    @Query("SELECT u.id FROM User u WHERE u.deleted = false AND u.enabled = true")
    List<String> findIdsByDeletedFalseAndEnabledTrue();

    @Query("SELECT u.id FROM User u WHERE u.deleted = false AND u.enabled = true AND u.accountType = :accountType")
    List<String> findIdsByDeletedFalseAndEnabledTrueAndAccountType(@Param("accountType") AccountType accountType);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.accessTokenFlag = u.accessTokenFlag + 1 WHERE LOWER(u.email) = LOWER(:email)")
    int incrementAccessTokenFlag(@Param("email") String email);


    @Query("SELECT u.accessTokenFlag FROM User u WHERE LOWER(u.email) = LOWER(:email)")
     int getAccessTokenFlag(@Param("email") String email);

    default int incrementAndGetAccessTokenFlag(@Param("email") String email) {
        this.incrementAccessTokenFlag(email);
        return getAccessTokenFlag(email);
    }

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.refreshToken = :refreshToken WHERE LOWER(u.email) = LOWER(:email)")
    void saveRefreshToken(@Param("email") String email, @Param("refreshToken") String refreshToken);

    @Modifying
    @Transactional
    @Query("DELETE FROM User u WHERE LOWER(u.email) = LOWER(:email)")
    void deleteByEmail(@Param("email") String email);

}
