package org.openlmis.restapi.config;

import java.util.HashSet;
import java.util.Set;

public class FilterProductConfig {
    /**
     * filter wrong kit product
     */
    public static String[] WRONG_KIT_PRODUCT = new String[]{"SCOD10", "SCOD10-AL", "SCOD12", "SCOD12-AL"};
    /**
     * filter right kit product
     */
    public static String[] RIGHT_KIT_PRODUCT = new String[]{"26A01", "26B01", "26A02", "26B02"};

    public static Set ConvertArrayToSet(String[] strings){
        Set<String> hashSets = new HashSet<>();
        for (String str : strings) {
            hashSets.add(str);
        }
        return hashSets;
    }
}
