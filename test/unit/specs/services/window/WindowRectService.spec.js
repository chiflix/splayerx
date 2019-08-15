// import sinon from 'sinon';
import WindowRectService from '../../../../../src/renderer/services/window/WindowRectService';

describe('WindowRectService logic service', () => {
  const windowRectService = new WindowRectService();

  describe('calculateWindowSize method', () => {
    it('should calculateWindowSize successfully', () => {
      const MAXRECT = [window.screen.availWidth, window.screen.availHeight];
      const r1 = windowRectService
        .calculateWindowSize([320, 180], [1920, 1080], [1920, 1080], true, [2460, 1270]);
      expect(JSON.stringify(r1)).to.be.equal(JSON.stringify([1920, 1080]));
      const r2 = windowRectService
        .calculateWindowSize([320, 180], MAXRECT, [5000, 3000], true, MAXRECT);
      const isRatioBigger = 5000 / 3000 > window.screen.availWidth / window.screen.availHeight;
      const target2 = isRatioBigger ? [
        MAXRECT[0],
        Math.round((MAXRECT[0] / (5000 / 3000))),
      ]
        : [
          Math.round((5000 * MAXRECT[1]) / 3000),
          MAXRECT[1],
        ];
      expect(JSON.stringify(r2)).to.be.equal(JSON.stringify(target2));
    });
  });

  describe('WindowRectService calculateWindowRect method', () => {
    it('should rect not change after calculateWindowRect', () => {
      const r1 = windowRectService
        .calculateWindowRect([500, 300], true, [100, 100, 500, 300], [1920, 1080]);
      expect(JSON.stringify(r1)).to.be.equal(JSON.stringify([100, 100, 500, 300]));
    });
    it('should rect postion change two avail left && avail top after calculateWindowRect', () => {
      const r1 = windowRectService
        .calculateWindowRect([500, 300], true, [0, 0, 500, 300], [1920, 1080]);
      const target = [window.screen.availLeft, window.screen.availTop, 500, 300];
      expect(JSON.stringify(r1)).to.be.equal(JSON.stringify(target));
    });
    it('should rect change avail size after calculateWindowRect', () => {
      const r1 = windowRectService
        .calculateWindowRect([5000, 3000], true, [100, 100, 500, 300]);
      const isRatioBigger = 5000 / 3000 > window.screen.availWidth / window.screen.availHeight;
      const target = isRatioBigger ? [
        window.screen.availLeft,
        window.screen.availTop,
        window.screen.availWidth,
        Math.round(window.screen.availWidth / (5000 / 3000)),
      ]
        : [
          window.screen.availLeft,
          window.screen.availTop,
          Math.round((5000 * window.screen.availHeight) / 3000),
          window.screen.availHeight,
        ];
      expect(JSON.stringify(r1)).to.be.equal(JSON.stringify(target));
    });
  });

  describe('WindowRectService uploadWindowBy method', () => {
    it('should not change when is fullscreen', () => {
      const r1 = windowRectService.uploadWindowBy(true, 'playing-view', 0, 180, [720, 520], [50, 100]);
      const r2 = windowRectService.uploadWindowBy(true, 'landing-view', 0, 90, [720, 520], [50, 100]);
      const r3 = windowRectService.uploadWindowBy(true, 'playing-view', 270, 90, [300, 520], [400, 100]);
      const r4 = windowRectService.uploadWindowBy(true, 'landing-view', 270, 0, [300, 520], [400, 100]);
      const target = [];
      expect(JSON.stringify(r1)).to.be.equal(JSON.stringify(target));
      expect(JSON.stringify(r2)).to.be.equal(JSON.stringify(target));
      expect(JSON.stringify(r3)).to.be.equal(JSON.stringify(target));
      expect(JSON.stringify(r4)).to.be.equal(JSON.stringify(target));
    });
    it.only('should return size [720, 405] && scale by the center point when back to landing-view & not in fullscreen', () => {
      const winSize = [500, 500];
      const winPos = [200, 200];

      const r1 = windowRectService.uploadWindowBy(false, 'landing-view', undefined, undefined, winSize, winPos);

      const expectResult = windowRectService.calculateWindowPosition(
        winPos.concat(winSize),
        [
          window.screen.availLeft, window.screen.availTop,
          window.screen.availWidth, window.screen.availHeight,
        ],
        [720, 405],
      ).concat([720, 405]);

      expect(r1).to.be.deep.equal(expectResult);
    });
    it('should return size correct size when direction changed && is not fullscreen && not in landing-view', () => {
      const r1 = windowRectService.uploadWindowBy(false, 'playing-view', 90, 180, [520, 300], [50, 100]);
      const r2 = windowRectService.uploadWindowBy(false, 'playing-view', 0, 90, [520, 300], [50, 100]);
      const r3 = windowRectService.uploadWindowBy(false, 'playing-view', 270, 180, [300, 520], [200, 100]);
      const r4 = windowRectService.uploadWindowBy(false, 'playing-view', 270, 0, [300, 520], [200, 100]);
      const AVAI_LTOP = window.screen.availTop;
      const rect = [
        window.screen.availLeft,
        window.screen.availTop,
        window.screen.availWidth,
        window.screen.availHeight,
      ];
      console.log(rect);
      expect(JSON.stringify(r1)).to.be.equal(JSON.stringify([167, AVAI_LTOP, 320, 555]));
      expect(JSON.stringify(r2)).to.be.equal(JSON.stringify([167, AVAI_LTOP, 320, 555]));
      expect(JSON.stringify(r3)).to.be.equal(JSON.stringify([90, 210, 520, 300]));
      expect(JSON.stringify(r4)).to.be.equal(JSON.stringify([90, 210, 520, 300]));
    });
  });

  describe('WindowRectService calculateWindowScaleBy method', () => {
    it('should return 1 when window angle is horizontal direction ', () => {
      const r1 = windowRectService.calculateWindowScaleBy(false, 0, 1.5, 1.5);
      const r2 = windowRectService.calculateWindowScaleBy(false, 0, 0.5, 1.5);
      const r3 = windowRectService.calculateWindowScaleBy(false, 0, 1.5, 0.5);
      const r4 = windowRectService.calculateWindowScaleBy(false, 0, 0.5, 0.5);
      const r5 = windowRectService.calculateWindowScaleBy(false, 0, 1.5);
      const r6 = windowRectService.calculateWindowScaleBy(false, 0, 0.5);
      const r7 = windowRectService.calculateWindowScaleBy(false, 180, 1.5, 1.5);
      const r8 = windowRectService.calculateWindowScaleBy(false, 180, 0.5, 1.5);
      const r9 = windowRectService.calculateWindowScaleBy(false, 180, 1.5, 0.5);
      const r10 = windowRectService.calculateWindowScaleBy(false, 180, 0.5, 0.5);
      const r11 = windowRectService.calculateWindowScaleBy(false, 180, 1.5);
      const r12 = windowRectService.calculateWindowScaleBy(false, 180, 0.5);
      const r13 = windowRectService.calculateWindowScaleBy(true, 0, 1.5, 1.5);
      const r14 = windowRectService.calculateWindowScaleBy(true, 0, 0.5, 1.5);
      const r15 = windowRectService.calculateWindowScaleBy(true, 0, 1.5, 0.5);
      const r16 = windowRectService.calculateWindowScaleBy(true, 0, 0.5, 0.5);
      const r17 = windowRectService.calculateWindowScaleBy(true, 0, 1.5);
      const r18 = windowRectService.calculateWindowScaleBy(true, 0, 0.5);
      const r19 = windowRectService.calculateWindowScaleBy(true, 180, 1.5, 1.5);
      const r20 = windowRectService.calculateWindowScaleBy(true, 180, 0.5, 1.5);
      const r21 = windowRectService.calculateWindowScaleBy(true, 180, 1.5, 0.5);
      const r22 = windowRectService.calculateWindowScaleBy(true, 180, 0.5, 0.5);
      const r23 = windowRectService.calculateWindowScaleBy(true, 180, 1.5);
      const r24 = windowRectService.calculateWindowScaleBy(true, 180, 0.5);
      expect(r1).to.be.equal(1);
      expect(r2).to.be.equal(1);
      expect(r3).to.be.equal(1);
      expect(r4).to.be.equal(1);
      expect(r5).to.be.equal(1);
      expect(r6).to.be.equal(1);
      expect(r7).to.be.equal(1);
      expect(r8).to.be.equal(1);
      expect(r9).to.be.equal(1);
      expect(r10).to.be.equal(1);
      expect(r11).to.be.equal(1);
      expect(r12).to.be.equal(1);
      expect(r13).to.be.equal(1);
      expect(r14).to.be.equal(1);
      expect(r15).to.be.equal(1);
      expect(r16).to.be.equal(1);
      expect(r17).to.be.equal(1);
      expect(r18).to.be.equal(1);
      expect(r19).to.be.equal(1);
      expect(r20).to.be.equal(1);
      expect(r21).to.be.equal(1);
      expect(r22).to.be.equal(1);
      expect(r23).to.be.equal(1);
      expect(r24).to.be.equal(1);
    });

    it('should return 1.5 when window angle is vertical direction && not fullscreen && video ratio 1.5', () => {
      const r1 = windowRectService.calculateWindowScaleBy(false, 90, 1.5, 1.5);
      const r2 = windowRectService.calculateWindowScaleBy(false, 90, 1.5, 0.5);
      const r3 = windowRectService.calculateWindowScaleBy(false, 90, 1.5);
      expect(r1).to.be.equal(1.5);
      expect(r2).to.be.equal(1.5);
      expect(r3).to.be.equal(1.5);
    });

    it('should return 2 when window angle is vertical direction && not fullscreen && video ratio 0.5', () => {
      const r1 = windowRectService.calculateWindowScaleBy(false, 90, 0.5, 1.5);
      const r2 = windowRectService.calculateWindowScaleBy(false, 90, 0.5, 0.5);
      const r3 = windowRectService.calculateWindowScaleBy(false, 90, 0.5);
      expect(r1).to.be.equal(2);
      expect(r2).to.be.equal(2);
      expect(r3).to.be.equal(2);
    });

    it('should return 2 when window angle is vertical direction && fullscreen && video ratio 0.5 && windowRatio 1.5', () => {
      const r1 = windowRectService.calculateWindowScaleBy(true, 90, 0.5, 1.5);
      const r2 = windowRectService.calculateWindowScaleBy(true, 270, 0.5, 1.5);
      expect(r1).to.be.equal(2);
      expect(r2).to.be.equal(2);
    });

    it('should return 0.8 when window angle is vertical direction && fullscreen && video ratio 1.25 && windowRatio 1.5', () => {
      const r1 = windowRectService.calculateWindowScaleBy(true, 90, 1.25, 1.5);
      const r2 = windowRectService.calculateWindowScaleBy(true, 270, 1.25, 1.5);
      expect(r1).to.be.equal(0.8);
      expect(r2).to.be.equal(0.8);
    });

    it('should return 0.5 when window angle is vertical direction && fullscreen && video ratio 0.5 && windowRatio 0.5', () => {
      const r1 = windowRectService.calculateWindowScaleBy(true, 90, 0.5, 0.5);
      const r2 = windowRectService.calculateWindowScaleBy(true, 270, 0.5, 0.5);
      expect(r1).to.be.equal(0.5);
      expect(r2).to.be.equal(0.5);
    });

    it('should return 1.25 when window angle is vertical direction && fullscreen && video ratio 1.25 && windowRatio 0.5', () => {
      const r1 = windowRectService.calculateWindowScaleBy(true, 90, 1.25, 0.5);
      const r2 = windowRectService.calculateWindowScaleBy(true, 270, 1.25, 0.5);
      expect(r1).to.be.equal(1.25);
      expect(r2).to.be.equal(1.25);
    });
  });
});
