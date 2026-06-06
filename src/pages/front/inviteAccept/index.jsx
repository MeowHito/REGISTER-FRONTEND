import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin, Typography } from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    LoadingOutlined,
    LoginOutlined,
    UserSwitchOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import useMe from 'hooks/useMe';
import backOfficeServices from 'services/backoffice.services';

const { Text } = Typography;

const InviteAccept = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const { data: me, isLoading: isMeLoading, isError: isMeError } = useMe({ retry: 0 });
    const acceptInvite = backOfficeServices.useMutationAcceptInvite();

    const [status, setStatus] = useState('loading');
    const [invitedEmail, setInvitedEmail] = useState(null);

    useEffect(() => {
        if (!token) {
            setStatus('invalid');
        }
    }, [token]);

    useEffect(() => {
        if (!token) return;
        if (isMeLoading) return;

        if (isMeError || !me) {
            setStatus('login_required');
        } else {
            setStatus('accepting');
        }
    }, [token, me, isMeLoading, isMeError]);

    useEffect(() => {
        if (status !== 'accepting') return;

        acceptInvite.mutate(
            { token },
            {
                onSuccess: () => {
                    setStatus('success');
                },
                onError: (err) => {
                    const msg = err?.response?.data?.message || '';
                    const data = err?.response?.data?.data;
                    if (msg.includes('expired')) {
                        setStatus('expired');
                    } else if (msg.includes('already been')) {
                        setStatus('already_accepted');
                    } else if (msg.includes('User not found')) {
                        setStatus('user_not_found');
                    } else if (msg.includes('email') && msg.includes('mismatch') || msg.includes('Email mismatch')) {
                        setInvitedEmail(data?.invitedEmail || '');
                        setStatus('email_mismatch');
                    } else {
                        setStatus('invalid');
                    }
                },
            }
        );
    }, [status]);

    const handleRedirectToLogin = () => {
        const returnUrl = `/invite/accept?token=${token}`;
        navigate('/login', { state: { from: returnUrl } });
    };

    const handleGoToEvent = () => {
        navigate('/backoffice/eventList');
    };

    const handleGoHome = () => {
        navigate('/');
    };

    if (status === 'loading' || status === 'accepting') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <Spin indicator={<LoadingOutlined className="text-4xl" spin />} />
                    <div className="mt-4">
                        <Text type="secondary" className="text-lg">
                            {status === 'loading'
                                ? t('invite.accept.checking', 'กำลังตรวจสอบ...')
                                : t('invite.accept.accepting', 'กำลังยอมรับคำเชิญ...')}
                        </Text>
                    </div>
                </div>
            </div>
        );
    }

    const configs = {
        success: {
            status: 'success',
            icon: <CheckCircleOutlined className="text-green-500" />,
            title: t('invite.accept.successTitle', 'ยอมรับคำเชิญสำเร็จ!'),
            subTitle: t('invite.accept.successSubtitle', 'คุณได้รับสิทธิ์เข้าถึงกิจกรรมแล้ว'),
            extra: [
                <Button key="event" type="primary" size="large" onClick={handleGoToEvent}>
                    {t('invite.accept.goToEvent', 'ไปที่กิจกรรม')}
                </Button>,
            ],
        },
        expired: {
            status: 'warning',
            icon: <ClockCircleOutlined className="text-orange-500" />,
            title: t('invite.accept.expiredTitle', 'คำเชิญหมดอายุแล้ว'),
            subTitle: t('invite.accept.expiredSubtitle', 'คำเชิญนี้หมดอายุแล้ว กรุณาติดต่อผู้เชิญเพื่อส่งคำเชิญใหม่'),
            extra: [
                <Button key="home" size="large" onClick={handleGoHome}>
                    {t('invite.accept.goHome', 'กลับหน้าหลัก')}
                </Button>,
            ],
        },
        already_accepted: {
            status: 'info',
            icon: <CheckCircleOutlined className="text-blue-500" />,
            title: t('invite.accept.alreadyTitle', 'คำเชิญนี้ถูกใช้งานแล้ว'),
            subTitle: t('invite.accept.alreadySubtitle', 'คุณได้ยอมรับคำเชิญนี้ไปแล้วก่อนหน้า'),
            extra: [
                <Button key="event" type="primary" size="large" onClick={handleGoToEvent}>
                    {t('invite.accept.goToEvent', 'ไปที่กิจกรรม')}
                </Button>,
            ],
        },
        user_not_found: {
            status: 'error',
            icon: <ExclamationCircleOutlined className="text-red-500" />,
            title: t('invite.accept.userNotFoundTitle', 'ไม่พบบัญชีผู้ใช้'),
            subTitle: t('invite.accept.userNotFoundSubtitle', 'ไม่พบบัญชีผู้ใช้สำหรับอีเมลนี้ กรุณาสมัครสมาชิกก่อนแล้วลองอีกครั้ง'),
            extra: [
                <Button key="register" type="primary" size="large" onClick={() => navigate('/register')}>
                    {t('invite.accept.register', 'สมัครสมาชิก')}
                </Button>,
                <Button key="home" size="large" onClick={handleGoHome}>
                    {t('invite.accept.goHome', 'กลับหน้าหลัก')}
                </Button>,
            ],
        },
        email_mismatch: {
            status: 'warning',
            icon: <UserSwitchOutlined className="text-orange-500" />,
            title: t('invite.accept.emailMismatchTitle', 'อีเมลไม่ตรงกับคำเชิญ'),
            subTitle: t('invite.accept.emailMismatchSubtitle',
                'คำเชิญนี้ถูกส่งถึง {{email}} กรุณาเข้าสู่ระบบด้วยอีเมลดังกล่าวแล้วลองอีกครั้ง',
                { email: invitedEmail || '—' }
            ),
            extra: [
                <Button key="logout-login" type="primary" size="large" icon={<LoginOutlined />} onClick={() => navigate('/login')}>
                    {t('invite.accept.switchAccount', 'เข้าสู่ระบบด้วยบัญชีอื่น')}
                </Button>,
                <Button key="home" size="large" onClick={handleGoHome}>
                    {t('invite.accept.goHome', 'กลับหน้าหลัก')}
                </Button>,
            ],
        },
        login_required: {
            status: 'info',
            icon: <LoginOutlined className="text-blue-500" />,
            title: t('invite.accept.loginRequiredTitle', 'กรุณาเข้าสู่ระบบ'),
            subTitle: t('invite.accept.loginRequiredSubtitle', 'คุณต้องเข้าสู่ระบบก่อนเพื่อยอมรับคำเชิญนี้'),
            extra: [
                <Button key="login" type="primary" size="large" icon={<LoginOutlined />} onClick={handleRedirectToLogin}>
                    {t('invite.accept.login', 'เข้าสู่ระบบ')}
                </Button>,
            ],
        },
        invalid: {
            status: 'error',
            icon: <ExclamationCircleOutlined className="text-red-500" />,
            title: t('invite.accept.invalidTitle', 'คำเชิญไม่ถูกต้อง'),
            subTitle: t('invite.accept.invalidSubtitle', 'ลิงก์คำเชิญนี้ไม่ถูกต้องหรือถูกยกเลิกแล้ว'),
            extra: [
                <Button key="home" size="large" onClick={handleGoHome}>
                    {t('invite.accept.goHome', 'กลับหน้าหลัก')}
                </Button>,
            ],
        },
    };

    const config = configs[status] || configs.invalid;

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full mx-4">
                <Result
                    status={config.status}
                    icon={config.icon}
                    title={config.title}
                    subTitle={config.subTitle}
                    extra={config.extra}
                />
            </div>
        </div>
    );
};

export default InviteAccept;
