package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.util.ArrayList;
import java.util.List;

@Entity(name = "dictionary_sense")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Sense {
    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference("entry-senses")
    private DictionaryEntry entry;

    /** Display label, e.g. "Verb", "Noun", "Conjunction". */
    private String pos;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> translations;

    private int sortOrder;

    @OneToMany(mappedBy = "sense", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("sense-examples")
    private List<Example> examples = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
    }
}
