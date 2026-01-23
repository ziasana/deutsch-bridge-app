package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.NomenVerbConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NomenVerbConnectionRepository extends JpaRepository<NomenVerbConnection,String> {

    @Query("""
    SELECT DISTINCT nv
    FROM nomenVerbs nv
""")
    List<NomenVerbConnection> getWithLearningProgress();

}
