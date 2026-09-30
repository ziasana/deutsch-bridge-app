package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ReadingCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReadingCategoryRepository extends JpaRepository<ReadingCategory, String> {

    List<ReadingCategory> findAllByOrderByTitleAsc();

    boolean existsByTitleIgnoreCase(String title);

    boolean existsByTitleIgnoreCaseAndIdNot(String title, String id);
}
