// Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved

import { Component, OnDestroy, OnInit } from '@angular/core';
import { BucketRef, UsageConsumptionReport } from '../../../../../../core';
import { Observable, Subscription } from 'rxjs';
import { ChartOptions, ChartType } from 'chart.js';
import { UsageConsumptionService } from '../../../../../../core/subscription';
import { ActivatedRoute, Params } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'cx-usage-consumption-piechart',
  templateUrl: './usage-consumption-piechart.component.html',
  styleUrls: ['./usage-consumption-piechart.component.scss'],
})
export class UsageConsumptionPiechartComponent implements OnInit, OnDestroy {
  subscriptionId: string;
  usageConsumptionReport$: Observable<UsageConsumptionReport>;
  public doughnutChartType: ChartType = 'pie';
  public pieChartLegend = false;
  public pieChartOptions: ChartOptions = {
    responsive: true,
  };
  protected subscription = new Subscription();

  constructor(
    protected subscriptionService: UsageConsumptionService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.activatedRoute.params
        .pipe(
          filter((params: Params) => !!params)
        )
        .subscribe((params: Params) => {
          this.subscriptionId = params['subscriptionId'];
        })
    );
    this.usageConsumptionReport$ = this.fetchUsageConsumptionReport();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.subscriptionService.clearUsageConsumptionDetails();
  }

  fetchUsageConsumptionReport(): Observable<UsageConsumptionReport> {
    return this.subscriptionService.fetchUsageConsumption(this.subscriptionId);
  }

  getProductName(bucket: BucketRef): string {
    return bucket.product.name;
  }

  getDoughnutChartData(bucket: BucketRef): number[] {
    if (bucket.bucketBalance[0].remainingValue < 0) {
      return [bucket.bucketCounter[0].value, 0];
    }
    return [
      bucket.bucketCounter[0].value,
      bucket.bucketBalance[0].remainingValue,
    ];
  }

  isOverUsage(bucket: BucketRef): boolean {
    return bucket.bucketBalance[0].remainingValue < 0;
  }

  getRemainingUsage(bucket: BucketRef): number {
    if (bucket.bucketBalance[0].remainingValue > 0) {
      return bucket.bucketBalance[0].remainingValue;
    }
    return 0;
  }
}
