package org.openlmis.restapi.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.google.common.base.Function;
import com.google.common.collect.FluentIterable;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.openlmis.core.domain.Signature;
import org.openlmis.core.domain.moz.ProgramDataForm;
import org.openlmis.core.domain.moz.ProgramDataItem;
import org.openlmis.core.hash.Encoder;
import org.openlmis.core.serializer.DateDeserializer;
import org.openlmis.core.serializer.DateTimeDeserializer;

import java.util.Date;
import java.util.List;


@Data
@NoArgsConstructor
public class ProgramDataFormDTO {

  private Long facilityId;
  private String programCode;
  @JsonDeserialize(using = DateDeserializer.class)
  private Date periodBegin;
  @JsonDeserialize(using = DateDeserializer.class)
  private Date periodEnd;
  @JsonDeserialize(using = DateTimeDeserializer.class)
  private Date submittedTime;
  private List<ProgramDataFormItemDTO> programDataFormItems;
  private List<Signature> programDataFormSignatures;

  public ProgramDataFormDTO(Long facilityId, String programCode, Date startDate, Date endDate, Date submittedTime) {
    this.facilityId = facilityId;
    this.programCode = programCode;
    this.periodBegin = startDate;
    this.periodEnd = endDate;
    this.submittedTime = submittedTime;
  }

  @JsonIgnore
  public String getSyncUpHash() {
    String programDataString = this.programCode + this.periodBegin.toString() + this.periodEnd.toString() +
        this.submittedTime.toString() + this.facilityId.toString();
    return Encoder.hash(programDataString);
  }

  public static ProgramDataFormDTO prepareForRest(ProgramDataForm programDataForm) {
    ProgramDataFormDTO programDataFormDTO = new ProgramDataFormDTO(programDataForm.getFacility().getId(),
        programDataForm.getSupplementalProgram().getCode(), programDataForm.getStartDate(),
        programDataForm.getEndDate(), programDataForm.getSubmittedTime());
    programDataFormDTO.setProgramDataFormItems(FluentIterable.from(programDataForm.getProgramDataItems()).transform(new Function<ProgramDataItem, ProgramDataFormItemDTO>() {
      @Override
      public ProgramDataFormItemDTO apply(ProgramDataItem input) {
        return ProgramDataFormItemDTO.prepareForRest(input);
      }
    }).toList());
    programDataFormDTO.setProgramDataFormSignatures(programDataForm.getProgramDataFormSignatures());
    return programDataFormDTO;
  }
}