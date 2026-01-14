package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.NomenVerbConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NomenVerbConnectionRepository extends JpaRepository<NomenVerbConnection,String> {
}
