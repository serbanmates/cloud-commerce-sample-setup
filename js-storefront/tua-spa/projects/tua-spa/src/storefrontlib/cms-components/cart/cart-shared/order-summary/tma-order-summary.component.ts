// Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved

import { Component, Input, OnInit } from '@angular/core';
import { CurrencyService } from '@spartacus/core';
import { Observable } from 'rxjs';
import { TmaCart } from '../../../../../core/model';
import { OrderSummaryComponent } from '@spartacus/cart/base/components';
import { TmaCartPriceService } from '../../../../../core';

@Component({
  selector: 'cx-order-summary',
  templateUrl: './tma-order-summary.component.html'
})
export class TmaOrderSummaryComponent extends OrderSummaryComponent implements OnInit {

  @Input()
  cart: TmaCart;

  currency$: Observable<string>;

  constructor(
    protected cartPriceService: TmaCartPriceService,
    protected currencyService: CurrencyService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.currency$ = this.currencyService.getActive();
  }
}
