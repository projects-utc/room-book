package vn.odauday.stay.domain.room.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "room_blocks")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomBlockEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long roomId;

    @Column(length = 200)
    private String roomName;

    @Column(name = "start_date", length = 30, nullable = false)
    @JsonProperty("start")
    private String start;

    @Column(name = "end_date", length = 30, nullable = false)
    @JsonProperty("end")
    private String end;

    @Column(length = 500)
    private String reason;
}
