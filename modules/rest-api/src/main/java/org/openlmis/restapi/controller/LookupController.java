/*
 * Copyright © 2013 VillageReach. All Rights Reserved. This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 *
 * If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

package org.openlmis.restapi.controller;

import lombok.NoArgsConstructor;
import org.openlmis.report.service.ReportLookupService;
import org.openlmis.restapi.response.RestResponse;
import org.openlmis.restapi.service.RestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import java.security.Principal;

@Controller
@NoArgsConstructor
public class LookupController {

    public static final String ACCEPT_JSON = "Accept=application/json";
    public static final String UNEXPECTED_EXCEPTION = "unexpected.exception";
    public static final String FORBIDDEN_EXCEPTION = "forbidden.exception";


    @Autowired
    private RestService restService;

    @Autowired
    private ReportLookupService lookupService;

    @RequestMapping(value = "/rest-api/lookup/products", method = RequestMethod.GET, headers = ACCEPT_JSON)
    public ResponseEntity getProducts( Principal principal) {
    return RestResponse.response("products", lookupService.getAllProducts());
    }


    @RequestMapping(value = "/rest-api/lookup/dosage-units", method = RequestMethod.GET, headers = ACCEPT_JSON)
     public ResponseEntity getDosageUnits( Principal principal) {
        return RestResponse.response("dosage-units", lookupService.getDosageUnits());
    }

    @RequestMapping(value = "/rest-api/lookup/facility-types", method = RequestMethod.GET, headers = ACCEPT_JSON)
    public ResponseEntity getFacilityTypes( Principal principal) {
        return RestResponse.response("facility-types", lookupService.getFacilityTypes());
    }

    @RequestMapping(value = "/rest-api/lookup/facilities", method = RequestMethod.GET, headers = ACCEPT_JSON)
    public ResponseEntity getFacilities( Principal principal) {
        return RestResponse.response("facilities", lookupService.getFacilities());
    }
}
