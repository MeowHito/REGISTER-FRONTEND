import React from 'react';

import TrueMoneyWalletIcon from '../assets/images/truemoney_wallet_logo.png';
import RabbitLinePayIcon from '../assets/images/linepay_logo.png';
import AlipayIcon from '../assets/images/alipay-logo.jpg';
import AlipayPlusIcon from '../assets/images/alipay-plus-logo.png';
import WechatIcon from '../assets/images/wechat_pay-logo.png';

export const TrueMoneyIcon = ({ sizew = 64 ,sizeh = 32 }) => (
    <img src={TrueMoneyWalletIcon} alt="TrueMoney Wallet" style={{ width: sizew, height: sizeh }} />
);

export const RabbitLinePayIconComponent = ({ sizew = 64 ,sizeh = 32  }) => (
    <img src={RabbitLinePayIcon} alt="Rabbit LINE Pay" style={{ width: sizew, height: sizeh }} />
);

export const AlipayIconComponent = ({ sizew = 64 ,sizeh = 32  }) => (
    <img src={AlipayIcon} alt="Alipay" style={{ width: sizew, height: sizeh }} />
);
export const AlipayPlusIconComponent = ({ sizew = 64 ,sizeh = 32  }) => (
    <img src={AlipayPlusIcon} alt="AlipayPlus" style={{ width: sizew, height: sizeh }} />
);
export const WechatIconComponent = ({ sizew = 64 ,sizeh = 32  }) => (
    <img src={WechatIcon} alt="Wechat" style={{ width: sizew, height: sizeh }} />
);