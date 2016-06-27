package org.openlmis.web.controller.cubesreports.validation;

import lombok.Getter;
import org.openlmis.core.domain.moz.MozFacilityTypes;

@Getter
public class CubesAccessInfo {
    private MozFacilityTypes currentUserFacilityType;
    private String facility;
    private String district;
    private String province;

    public static CubesAccessInfo createInstance(MozFacilityTypes currentUserFacilityType, String cubesQueryString) {
        CubesAccessInfo cubesAccessInfo = new CubesAccessInfo();
        cubesAccessInfo.currentUserFacilityType = currentUserFacilityType;

        assignLocations(cubesQueryString, cubesAccessInfo);

        return cubesAccessInfo;
    }

    private static void assignLocations(String s, CubesAccessInfo cubesAccessInfo) {
        String[] dimensions = s.split("=")[1].split("\\|");

        for (String dimension : dimensions) {
            if (dimension.startsWith("facility")) {
                cubesAccessInfo.facility = dimension.split(":")[1];
            } else if (dimension.startsWith("location")) {
                String provinceAndDistrictInString = dimension.split(":")[1];
                String[] provinceAndDistrict = provinceAndDistrictInString.split(",");
                cubesAccessInfo.province = provinceAndDistrict[0];
                if (provinceAndDistrict.length > 1) {
                    cubesAccessInfo.district = provinceAndDistrict[1];
                }
            }
        }
    }
}