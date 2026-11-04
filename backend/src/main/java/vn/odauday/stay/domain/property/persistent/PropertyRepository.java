package vn.odauday.stay.domain.property.persistent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.odauday.stay.domain.property.model.PropertyEntity;

import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<PropertyEntity, Long> {
    List<PropertyEntity> findByOwner(String owner);
}
