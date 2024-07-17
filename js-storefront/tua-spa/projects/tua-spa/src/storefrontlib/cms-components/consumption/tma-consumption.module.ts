// Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { CmsConfig, ConfigModule, I18nModule, UrlModule } from '@spartacus/core';
import { IconModule } from '@spartacus/storefront';
import { TmaConsumptionComponent } from './consumption-component/tma-consumption.component';
import { TmaPoSearchByConsumptionComponent } from './po-search-by-consumption-component/tma-po-search-by-consumption.component';
import { TmaSliderOptionComponent } from './slider-option-component/tma-slider-option.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    RouterModule,
    UrlModule,
    I18nModule,
    NgbNavModule,
    ReactiveFormsModule,
    IconModule,
    ConfigModule.withConfig(<CmsConfig>{
      cmsComponents: {
        ConsumptionListComponent: {
          component: TmaConsumptionComponent
        }
      }
    })
  ],
  declarations: [
    TmaConsumptionComponent,
    TmaPoSearchByConsumptionComponent,
    TmaSliderOptionComponent
  ],
  exports: [
    TmaConsumptionComponent,
    TmaPoSearchByConsumptionComponent,
    TmaSliderOptionComponent
  ]
})
export class TmaConsumptionModule {
}
