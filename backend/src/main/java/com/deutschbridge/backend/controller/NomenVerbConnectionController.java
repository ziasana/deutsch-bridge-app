package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.entity.NomenVerbConnection;
import com.deutschbridge.backend.service.NomenVerbConnectionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/nomen-verb")
public class NomenVerbConnectionController {

    private final NomenVerbConnectionService nomenVerbConnectionService;

    public NomenVerbConnectionController(NomenVerbConnectionService nomenVerbConnectionService) {
        this.nomenVerbConnectionService = nomenVerbConnectionService;
    }

    @GetMapping
    public ResponseEntity<List<NomenVerbConnection>> getAllNomenVerbConnections() {
        return new ResponseEntity<>(nomenVerbConnectionService.findAll(), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<NomenVerbConnection> save(@RequestBody NomenVerbConnection vocabulary) {
        return new ResponseEntity<>(nomenVerbConnectionService.save(vocabulary),HttpStatus.CREATED);
    }

    @PostMapping("/bulk")
    public List<NomenVerbConnection> saveBulk(@RequestBody List<NomenVerbConnection> list) {
        return nomenVerbConnectionService.saveAll(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NomenVerbConnection> getNomenVerbConnectionById(@PathVariable String id) throws DataNotFoundException {
        return new ResponseEntity<>(nomenVerbConnectionService.findById(id), HttpStatus.FOUND);
    }

    @PutMapping("/{id}")
    public ResponseEntity<NomenVerbConnection> update(@RequestBody NomenVerbConnection vocabulary, @PathVariable String id) throws DataNotFoundException {
        return new ResponseEntity<>(nomenVerbConnectionService.update(vocabulary, id), HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Boolean> deleteById(@PathVariable String id) throws DataNotFoundException {
        return new ResponseEntity<>(nomenVerbConnectionService.deleteById(id), HttpStatus.NO_CONTENT);
    }
}
