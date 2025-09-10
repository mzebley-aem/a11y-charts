import { ApplicationConfig } from '@angular/core';
import { NGX_ECHARTS_CONFIG } from 'ngx-echarts';
import * as echarts from 'echarts';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: NGX_ECHARTS_CONFIG, useValue: { echarts } }
  ]
};
