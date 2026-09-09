import {test} from '@playwright/test';
import {footerTests} from './helpers/mobile-footer';
test.use({isMobile:true,hasTouch:true,deviceScaleFactor:1});
footerTests('chromium');
