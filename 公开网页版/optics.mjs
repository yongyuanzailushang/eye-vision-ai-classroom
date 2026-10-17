// Paraxial two-thin-lens model, lengths in metres, powers in dioptres.
// Eye is an equivalent thin lens in air. Far object, relaxed accommodation.
export const EYE_POWER = 1 / 0.017;
export const GAP = 0.006;
export const initialState = () => ({ lengthMm: 17, lensD: 0 });
export function validateState(s) {
  if (!s || !Number.isFinite(s.lengthMm) || s.lengthMm < 15 || s.lengthMm > 19 ||
      !Number.isFinite(s.lensD) || Math.abs(s.lensD) > 12) throw new Error('实验参数超出范围');
  return { lengthMm: s.lengthMm, lensD: s.lensD };
}
export function correctionPower(lengthMm) {
  const q = 1 / (lengthMm / 1000) - EYE_POWER;
  return q / (1 + GAP * q);
}
export function calculate(state) {
  const s = validateState(state), L = s.lengthMm / 1000;
  const effectivePower = EYE_POWER + s.lensD / (1 - GAP * s.lensD);
  const focusMm = 1000 / effectivePower;
  const errorMm = focusMm - s.lengthMm;
  // Blur circle for a 3 mm aperture at the equivalent eye lens.
  const blurDiameterMm = 3 * Math.abs(1 - L * effectivePower);
  const position = Math.abs(errorMm) < 0.08 ? 'on' : errorMm < 0 ? 'before' : 'behind';
  const positionText = { on:'视网膜上', before:'视网膜前', behind:'视网膜后' }[position];
  const fact = position === 'on' ? '像落在视网膜上，黑板恢复清晰。' :
    `像落在${positionText}，视网膜上出现弥散的光斑，黑板变模糊。`;
  return { ...s, effectivePower, focusMm, errorMm, blurDiameterMm, position, positionText,
    fact, suggestedLens: s.lengthMm > 17.08 ? '凹透镜' : s.lengthMm < 16.92 ? '凸透镜' : '无需矫正镜片' };
}
export function applyActions(state, actions) {
  if (!Array.isArray(actions) || actions.length < 1 || actions.length > 5) throw new Error('无法执行这组操作');
  let s = validateState(state);
  for (const a of actions) {
    if (!a || typeof a !== 'object') throw new Error('无效操作');
    switch (a.type) {
      case 'normal': s = initialState(); break;
      case 'long_eye': s = { lengthMm: 19, lensD: 0 }; break;
      case 'short_eye': s = { lengthMm: 15, lensD: 0 }; break;
      case 'set_length':
        if (!Number.isFinite(a.valueMm) || a.valueMm < 15 || a.valueMm > 19) throw new Error('长度需在15至19毫米之间');
        s.lengthMm = a.valueMm; break;
      case 'change_length':
        if (!Number.isFinite(a.valueMm) || Math.abs(a.valueMm) > 4 || a.valueMm === 0) throw new Error('无效长度变化');
        s.lengthMm = Math.min(19, Math.max(15, s.lengthMm + a.valueMm)); break;
      case 'lens': {
        if (!['concave','convex','none'].includes(a.lens)) throw new Error('无效镜片');
        const needed = Math.abs(correctionPower(s.lengthMm));
        const magnitude = needed > 0.001 ? needed : 3;
        s.lensD = a.lens === 'none' ? 0 : a.lens === 'concave' ? -magnitude : magnitude;
        break;
      }
      case 'observe': break;
      default: throw new Error('不支持的实验操作');
    }
    validateState(s);
  }
  return { state: s, result: calculate(s) };
}
export function rayAt(state, heightM, xM) {
  const eyeHeight = heightM * (1 - GAP * state.lensD);
  const initialSlope = -state.lensD * heightM;
  const exitSlope = initialSlope - EYE_POWER * eyeHeight;
  return xM < 0 ? heightM + initialSlope * (xM + GAP) : eyeHeight + exitSlope * xM;
}
