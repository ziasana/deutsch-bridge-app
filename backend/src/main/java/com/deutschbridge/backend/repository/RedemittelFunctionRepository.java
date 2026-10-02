package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.RedemittelFunction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RedemittelFunctionRepository extends JpaRepository<RedemittelFunction, String> {

    List<RedemittelFunction> findAllByOrderBySortOrderAscLabelAsc();

    boolean existsByLabelIgnoreCase(String label);

    boolean existsByLabelIgnoreCaseAndIdNot(String label, String id);
}
