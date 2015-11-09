/*
 *
 * Electronic Logistics Management Information System (eLMIS) is a supply chain management system for health commodities in a developing country setting.
 *
 *  Copyright (C) 2015  John Snow, Inc (JSI). This program was produced for the U.S. Agency for International Development (USAID). It was prepared under the USAID | DELIVER PROJECT, Task Order 4.
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details.
 *
 *    You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

function ViewbundledDistributionVacinationSuppliesController($scope,Period,VaccineReportFacilities, messageService, ViewBundledDistributionVaccinationSupplies){
    $scope.onProgramChanged = function () {
        VaccineReportFacilities.get({programId: $scope.filter.program}, function (data) {
            $scope.facilities = data.facilities;
        });
    };
    $scope.OnFilterChanged = function() {
        $scope.data = $scope.datarows = [];
        $scope.filter.max = 10000;

        Period.get({id: $scope.filter.period}, function(data){
            $scope.period = data.period;
        });


alert('here i ma on filter11');
    ViewBundledDistributionVaccinationSupplies.get({
        year:'2015',
        productId: '2423'
    }, function (data) {
        $scope.bundledDistributionVaccinationSupplies = data.bundledDistributionVaccinationSupplies;
        alert('here'+data.bundledDistributionVaccinationSupplies.length);


    });

    };
};