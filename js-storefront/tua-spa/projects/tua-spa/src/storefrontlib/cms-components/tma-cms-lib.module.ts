// Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved

import { NgModule } from '@angular/core';
import { TmaAddressFormModule } from './address-form';
import { TmaCartComponentModule } from './cart';
import { TmaCheckoutComponentModule } from './checkout';
import { TmaConsumptionModule } from './consumption';
import { TmaGuidedSellingModule } from './guided-selling';
import { JourneyChecklistComponentModule } from './journey-checklist';
import { SelfcareModule, SubscriptionComponentModule } from './myaccount';
import { TmaOrderModule } from './myaccount/order/tma-order.module';
import { TmaOrderConfirmationModule } from './order-confirmation';
import { TmaProductListModule, TmaProductSummaryModule } from './product';
import { TmaProductTabsModule } from './product/product-tabs';
import { ServiceabilityBannerModule } from './serviceability';
import { ServiceabilityButtonModule } from './serviceability-button';
import { TmaOrderApprovalModule } from './order-approval';
import { TmaProductSpecificationModule } from './product/tma-product-specification/tma-product-specification.module';
import { TmaProductOrderModule } from '../../core/product-order';
import { SelfcareStoreModule } from '../../core/selfcare/store/selfcare-store.module';
import { UserModule } from '@spartacus/core';
import { TmaChecklistModule } from './checklist';

@NgModule({
  imports: [
    TmaProductListModule,
    TmaProductSummaryModule,
    TmaProductTabsModule,
    TmaCartComponentModule,
    TmaCheckoutComponentModule,
    TmaOrderConfirmationModule,
    TmaOrderModule,
    SubscriptionComponentModule,
    TmaGuidedSellingModule,
    JourneyChecklistComponentModule,
    TmaChecklistModule,
    TmaAddressFormModule,
    TmaConsumptionModule,
    ServiceabilityBannerModule,
    ServiceabilityButtonModule,
    TmaOrderApprovalModule,
    TmaProductSpecificationModule,
    SelfcareModule,
    SelfcareStoreModule,
    UserModule,
    TmaProductOrderModule.forRoot(),
  ],
  declarations: []
})
export class TmaCmsLibModule {}

