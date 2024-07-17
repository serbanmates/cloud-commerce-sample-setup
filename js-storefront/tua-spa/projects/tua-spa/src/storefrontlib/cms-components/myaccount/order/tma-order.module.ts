// Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved

import { NgModule } from '@angular/core';
import { TmaOrderDetailsModule } from './order-details';
import { OrderModule } from '@spartacus/order';
import {
  OrderCancellationModule,
  OrderHistoryModule,
  OrderReturnModule,
  ReturnRequestDetailModule,
  ReturnRequestListModule
} from '@spartacus/order/components';

@NgModule({
  imports: [
    OrderHistoryModule,
    TmaOrderDetailsModule,
    OrderCancellationModule,
    OrderReturnModule,
    ReturnRequestListModule,
    ReturnRequestDetailModule
  ]
})
export class TmaOrderModule extends OrderModule { }
