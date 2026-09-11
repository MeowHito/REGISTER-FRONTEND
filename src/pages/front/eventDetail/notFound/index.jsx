import { ArrowRightOutlined, CompassOutlined, HomeOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Col, Row, Skeleton } from 'antd';
import Search from 'antd/es/input/Search';
import EventCard from 'components/eventCard';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import generalService from 'services/general.services';
import { findSimilarEvents, pickUpcomingEvents, scoreEventMatch, STRONG_MATCH_SCORE } from 'utils/eventSuggestion';

const EventNotFound = ({ slug, isServerError = false, onRetry, embedded = false }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const { data: events, isFetching } = generalService.useQuerySuggestedEvents({
        enabled: !isServerError,
    });

    const similar = useMemo(() => findSimilarEvents(slug, events || []), [slug, events]);
    const upcoming = useMemo(
        () => (similar.length ? [] : pickUpcomingEvents(events || [])),
        [similar, events]
    );
    const suggestions = similar.length ? similar : upcoming;
    const bestMatch = similar[0] && scoreEventMatch(slug, similar[0]) >= STRONG_MATCH_SCORE
        ? similar[0]
        : null;

    const suggestionTitle = bestMatch
        ? t('front.eventDetail.notFound.didYouMean', {
            name: bestMatch.name,
            interpolation: { escapeValue: false },
        })
        : t(similar.length
            ? 'front.eventDetail.notFound.similarTitle'
            : 'front.eventDetail.notFound.upcomingTitle');

    const handleSearch = (value) => {
        const keyword = value?.trim();
        navigate(keyword ? `/event?search=${encodeURIComponent(keyword)}` : '/event');
    };

    if (isServerError) {
        return (
            <div className="max-w-screen-md mx-auto py-10 md:py-16 text-center">
                <Headline
                    title={t('front.eventDetail.notFound.errorTitle')}
                    description={t('front.eventDetail.notFound.errorDescription')}
                />
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {onRetry && (
                        <Button type="primary" size="large" icon={<ReloadOutlined />} onClick={onRetry}>
                            {t('front.eventDetail.notFound.retry')}
                        </Button>
                    )}
                    {!embedded && (
                        <Button size="large" icon={<CompassOutlined />} onClick={() => navigate('/event')}>
                            {t('front.eventDetail.notFound.allEvents')}
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-screen-lg mx-auto py-8 md:py-12">
            <div className="text-center">
                <Headline
                    title={t('front.eventDetail.notFound.title')}
                    description={t('front.eventDetail.notFound.description')}
                />
                {slug && (
                    <div className="mt-3 inline-block max-w-full truncate rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-500">
                        /eventDetail/{slug}
                    </div>
                )}
            </div>

            {isFetching ? (
                <Row justify="center" gutter={[8, 24]} className="!mt-10">
                    {[...Array(3)].map((_, index) => (
                        <Col className="flex" xs={12} md={8} key={`suggestion-skeleton-${index}`}>
                            <Skeleton active>
                                <EventCard />
                            </Skeleton>
                        </Col>
                    ))}
                </Row>
            ) : (
                suggestions.length > 0 && (
                    <div className="mt-10">
                        <div className="text-center text-lg md:text-xl font-semibold text-slate-800">
                            {suggestionTitle}
                        </div>
                        {bestMatch && suggestions.length > 1 && (
                            <div className="text-center text-sm text-gray-500 mt-1">
                                {t('front.eventDetail.notFound.otherMatches')}
                            </div>
                        )}
                        <Row justify="center" gutter={[8, 24]} className="!mt-6">
                            {suggestions.map((event) => (
                                <Col className="flex" xs={12} md={8} key={`suggestion-${event.id}`}>
                                    <EventCard {...event} />
                                </Col>
                            ))}
                        </Row>
                    </div>
                )
            )}

            <div className="mt-10 max-w-md mx-auto">
                <div className="text-center text-sm text-gray-500 mb-2">
                    {t('front.eventDetail.notFound.searchHint')}
                </div>
                <Search
                    placeholder={t('front.campaign.searchEvent')}
                    allowClear
                    enterButton={t('general.search')}
                    size="large"
                    onSearch={handleSearch}
                />
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-6">
                <Button type="primary" size="large" onClick={() => navigate('/event')}>
                    {t('front.eventDetail.notFound.allEvents')} <ArrowRightOutlined />
                </Button>
                {!embedded && (
                    <Button size="large" icon={<HomeOutlined />} onClick={() => navigate('/')}>
                        {t('front.error.back')}
                    </Button>
                )}
            </div>
        </div>
    );
};

const Headline = ({ title, description }) => (
    <>
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <CompassOutlined className="!text-4xl !text-gray-400" />
        </div>
        <h2 className="!mb-2 text-2xl md:text-3xl font-semibold text-slate-800">{title}</h2>
        <p className="text-gray-500 max-w-md mx-auto">{description}</p>
    </>
);

export default EventNotFound;
