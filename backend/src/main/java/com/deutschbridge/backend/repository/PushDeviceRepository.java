package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.PushDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PushDeviceRepository extends JpaRepository<PushDevice, String> {

    Optional<PushDevice> findByToken(String token);

    List<PushDevice> findByUserIdIn(Collection<String> userIds);

    @Transactional
    void deleteByUserIdAndToken(String userId, String token);

    @Transactional
    void deleteByTokenIn(Collection<String> tokens);
}
