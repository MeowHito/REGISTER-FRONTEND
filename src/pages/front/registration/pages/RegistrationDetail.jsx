import { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Tag, Checkbox, message, Divider, Collapse } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import FrontLayout from 'components/frontLayout';
import RegistrationSteps from '../components/RegistrationSteps';
import backOfficeServices from "services/backoffice.services";
import { AlertError, AlertWarning } from 'components/alert';
import dayjs from 'dayjs';
import _ from 'lodash';
import { getImageFileToUpload, getPublicUrl } from 'utils/fileUtils';
import { useDispatch, useSelector } from 'react-redux';
import { SET_ORDER } from 'store/reducers/contextSlice';
import { SYS_DATE_FORMAT } from 'constants/helper';
import { useTranslation } from 'react-i18next';
import { toStartOfDayISO } from 'utils/format';

function addHoursToNow(hours) {
	const now = new Date();
	now.setHours(now.getHours() + hours);
	return now.toISOString();
}

const RegistrationDetail = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch()
	const order = useSelector(state => state.context.order)
	const eventData = useSelector(state => state.context.eventData)
	const navigate = useNavigate();
	const [applicants, setApplicants] = useState([]);
	const [checkedValues, setCheckedValues] = useState([]);
	const [checkboxOptions, setCheckboxOptions] = useState([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const totalEventType = applicants.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
	const totalDiscount = applicants.reduce((sum, a) => sum + (Number(a.discountNoShirt) || 0), 0);
	const totalShipping = applicants.reduce((sum, a) => sum + (a.deliveryMethod === 'post' ? a.shippingFee : 0), 0);
	const grandTotal = totalEventType - totalDiscount + totalShipping;
	const prefix = "userData"

	const { mutateAsync: createOrder } = backOfficeServices.useMutationCreateOrder();
	const { mutateAsync: sendEmail } = backOfficeServices.useMutationSendEmail();

	useEffect(() => {
		if (order?.orderNo) {
			navigate("/registrationPayment", { replace: true });
			return;
		}

		if (!order?.applicants?.length) {
			message.warning(t("back.reg.payment.orderNotFound"));
			navigate("/", { replace: true });
			return;
		}

		setApplicants(order.applicants || []);

		let conditions = [];
		if (order.eventConditions && Array.isArray(order.eventConditions)) {
			conditions = order.eventConditions.map((c, i) => ({
				label: c.description,
				value: `eventCondition-${i}`,
			}));
		}
		setCheckboxOptions(conditions);
	}, [order?.orderNo, order?.applicants?.length]);

	const handleCheckboxChange = values => setCheckedValues(values);

	const processOrder = async () => {
		if (isSubmitting) return;

		if (order?.orderNo) {
			navigate("/registrationPayment", { replace: true });
			return;
		}

		if (!order?.applicants?.length) {
			message.warning(t("back.reg.payment.orderNotFound"));
			navigate("/", { replace: true });
			return;
		}

		setIsSubmitting(true);
		try {
			const email = order?.applicants?.[0]?.email;
			if (!email) {
				message.error("ไม่พบอีเมลสำหรับส่งยืนยัน");
				return;
			}

			const totalEventTypePrice = order.applicants.reduce((sum, applicant) => sum + (applicant.price || 0), 0);
			const totalShippingFee = totalShipping || 0;
			const finalTotalPrice = (totalEventTypePrice + totalShippingFee) - totalDiscount;

			const { ref2, ref3 } = generatePaymentReferences();

			const paymentDueDatetime = addHoursToNow(72);
			const orderDetails = await Promise.all(order.applicants.map(async applicant => {
				const pictureValue = applicant.pictureUrl;
				const fileList = Array.isArray(pictureValue) ? pictureValue : [];
				const oldKey =
					typeof pictureValue === "string"
						? pictureValue
						: (fileList?.[0]?.name ?? null);

				let pictureUrl = await getImageFileToUpload({
					fileList,
					prefix,
					oldKey,
				});

				return {
					isSelf: applicant.type === "self",
					firstName: applicant.firstName,
					lastName: applicant.lastName,
					firstNameEn: applicant.firstNameEn,
					lastNameEn: applicant.lastNameEn,
					gender: applicant.gender,
					birthDate: toStartOfDayISO(applicant.birthDate),
					email: applicant.email,
					phone: applicant.phone,
					nationality: applicant.nationality,
					idNo: applicant.idNo,
					healthIssues: applicant.healthIssues,
					bloodType: applicant.bloodType,
					emergencyContact: applicant.emergencyContact,
					emergencyRelation: applicant.emergencyRelation,
					emergencyPhone: applicant.emergencyPhone,
					teamClub: applicant.teamClub,
					deliveryMethod: applicant.deliveryMethod || "pickup",
					couponUsed: applicant.couponUsed,
					price: applicant.price,
					discountShirt: applicant.discountNoShirt,
					couponDiscount: applicant.couponDiscount,
					shippingFee: applicant.deliveryMethod === "post" ? applicant.shippingFee : 0,
					netPrice: (applicant.price || 0) - (applicant.discountNoShirt || 0) + (applicant.deliveryMethod === "post" ? applicant.shippingFee : 0),
					prefixPath: pictureUrl ? prefix : null,
					address: applicant.address,
					province: applicant.province,
					amphoe: applicant.amphoe,
					district: applicant.district,
					zipcode: applicant.zipcode,
					shippingAddress: applicant.shippingAddress,
					shippingProvince: applicant.shippingProvince,
					shippingAmphoe: applicant.shippingAmphoe,
					shippingDistrict: applicant.shippingDistrict,
					shippingZipcode: applicant.shippingZipcode,
					rules: applicant.rules,
					receiveShirt: applicant.noShirt === false,
					eventTypeId: applicant.eventTypeId,
					shirtTypeId: applicant.shirtTypeId,
					shirtSizeId: applicant.shirtSizeId,
					pricingId: applicant.pricingId,
					selectionAnswers: applicant.selectionAnswers,
					pictureUrl
				}
			}))

			const orderData = {
				paymentMethod: "",
				paymentDueDatetime: paymentDueDatetime,
				refno2: ref2,
				refno3: ref3,
				unitPrice: totalEventTypePrice,
				shippingFee: totalShippingFee,
				totalPrice: finalTotalPrice,
				eventId: order.eventId,
				qty: orderDetails.length,
				discountShirt: totalDiscount,
				orderDetails
			};

			const res = await createOrder(orderData);

			if (res.status !== 200) {
				const errorData = res.data;
				const errorCode = errorData?.errorCode;

				if (errorCode === 'QUOTA_EXCEEDED') {
					AlertError({
						title: t('back.reg.error.quotaExceededTitle'),
						text: t('back.reg.error.quotaExceeded', {
							name: errorData?.pricingName || errorData?.eventTypeName || t('general.unknown'),
							available: errorData?.availableQuota || 0
						}),
						onOk: () => navigate(`/registrationInfo/${order?.eventId}`)
					});
					return;
				}

				if (errorCode === 'PRICING_EXPIRED') {
					AlertWarning({
						title: t('back.reg.error.pricingExpiredTitle'),
						text: t('back.reg.error.pricingExpired', {
							name: errorData?.pricingName || t('general.unknown')
						}),
						onOk: () => navigate(`/registrationInfo/${order?.eventId}`)
					});
					return;
				}

				AlertError({
					title: t('back.reg.error.createOrderFailedTitle'),
					text: errorData?.message || t('back.reg.error.createOrderFailed')
				});
				return;
			}

			const data = res.data || {}
			const orderNo = data.orderNo;
			const paymentToken = data.paymentToken;
			const paymentStatus = data.paymentStatus;

			let newParsedData = { ...order, orderId: data.id, orderNo, paymentToken, paymentDueDatetime, paymentStatus, eventData: eventData || order.eventData };
			dispatch(SET_ORDER(newParsedData))
			const today = new Date();
			const dateRegister = convertDateToThaiFormatWithTime(today);
			const storedDataMail = newParsedData;

			const eventName = storedDataMail?.applicants?.[0]?.eventName || t("general.unknown");

			const paymentLink = `${globalThis.location.protocol}//${globalThis.location.host}/registrationLink?token=${paymentToken}`;
			const url = await getPublicUrl({ key: eventData?.pictureUrl, prefix: eventData?.prefixPath, isPublic: true });

			const emailData = {
				to: email,
				subject: `ชำระเงินการสมัครเข้าร่วมกิจกรรม${eventName}`,
				templateName: "registration-confirm",
				orderId: data.id,
				variables: {
					eventName,
					orderNo,
					dateRegister,
					grandTotal,
					paymentLink,
					coverImg: url,
					applicants: storedDataMail.applicants.map(app => ({
						firstName: app.firstName,
						lastName: app.lastName,
						eventTypeName: app.eventTypeName,
						ageGroupName: app.ageGroupName || "-",
						teamClub: app.teamClub,
						noShirt: app.noShirt,
						shirtTypeName: app.shirtTypeName,
						shirtSizeName: app.shirtSizeName || "-",
						deliveryMethod: app.deliveryMethod,
						price: Number(app.price) || 0,
						discountNoShirt: Number(app.discountNoShirt) || 0,
						shippingFee: app.deliveryMethod === 'post' ? app.shippingFee : 0
					}))
				}
			};

			try {
				await sendEmail(emailData);
				message.success("สร้างคำสั่งซื้อสำเร็จ! กำลังไปหน้าชำระเงิน...");
			} catch (err) {
				console.error("ส่งอีเมลล้มเหลว:", err);
				message.error("สร้างคำสั่งซื้อสำเร็จ แต่ไม่สามารถส่งอีเมลได้");
			}
			setTimeout(() => {
				navigate("/registrationPayment", { replace: true });
			}, 1000);
		} catch (error) {
			console.error("Create order failed:", error);

			if (error?.response?.status === 503) {
				AlertWarning({
					title: t('back.reg.error.systemBusyTitle'),
					text: t('back.reg.error.systemBusy')
				});
				return;
			}

			AlertError({
				title: t('back.reg.error.createOrderFailedTitle'),
				text: t('back.reg.error.createOrderFailed')
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const generatePaymentReferences = () => {
		const now = new Date();
		const ref2 = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

		const ref3 = "SCB";

		return { ref2, ref3 };
	};

	const convertDateToThaiFormatWithTime = (inputDate) => {
		if (!inputDate) {
			console.error(" Error: inputDate is undefined or null");
			return "Invalid Date";
		}

		let date;

		if (Array.isArray(inputDate) && inputDate.length >= 3) {
			date = new Date(inputDate[0], inputDate[1] - 1, inputDate[2], inputDate[3] || 0, inputDate[4] || 0);
		} else if (inputDate instanceof Date) {
			date = inputDate;
		} else {
			date = new Date(inputDate);
		}

		if (isNaN(date.getTime())) {
			console.error(" Error: inputDate is not a valid Date");
			return "Invalid Date";
		}

		const thaiMonths = [
			"มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
			"กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
		];

		const day = date.getDate();
		const month = thaiMonths[date.getMonth()];
		const year = date.getFullYear() + 543;
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');

		return `${day} ${month} ${year} ${hours}:${minutes}`;
	};

	const formatAddress = (addr, district, amphoe, province, zipcode, t) =>
		`${addr || "-"} ${t("back.reg.common.subdistrictPrefix")}${district || "-"} ` +
		`${t("back.reg.common.districtPrefix")}${amphoe || "-"} ` +
		`${t("back.reg.common.provincePrefix")}${province || "-"} ${zipcode || ""}`;

	return (
		<FrontLayout>
			<RegistrationSteps currentStep={1} />
			<div style={{ padding: '16px' }}>
				<div className="text-xl font-semibold text-orange-600 flex items-center gap-2 mb-1">📋 {t("back.reg.common.applicantInfo")}</div>

				<Tag icon={<ExclamationCircleOutlined />} color="volcano" style={{ marginBottom: 16 }}>
					{t("back.reg.common.incomplete")}
				</Tag>

				<Collapse
					accordion
					items={applicants.map((applicant, idx) => {
						const price = Number(applicant.price || 0);
						const discount = Number(applicant.discountNoShirt || 0);
						const deliveryFee = applicant.deliveryMethod === 'post' ? applicant.shippingFee : 0;
						const total = (price - discount) + deliveryFee;
						return {
							key: idx.toString(),
							label: (
								<Row justify="space-between" style={{ width: '100%' }}>
									<Col>
										<div className="font-bold">
											👤 {t("back.reg.common.applicantNumber")} {idx + 1} / {applicants.length}{" "}
											<span className="text-gray-500 ml-2">
												({applicant.firstName} {applicant.lastName})
											</span>
										</div>
									</Col>
									<Col>
										<div className="text-primary text-[16px] font-bold">
											{total.toLocaleString()} {t("general.unitBaht")}
										</div>
									</Col>
								</Row>
							),
							children: (
								<Card
									style={{
										marginBottom: 16,
									}}
									styles={{
										body: {
											padding: 24
										}
									}}
								>
									<Divider orientation="left">{t("back.reg.common.applicantInfo")}</Divider>
									<Row gutter={[0, 8]}>
										<Col span={24}>
											<div>
												<span className="font-bold">{t("back.reg.form.firstName")}: </span>
												{applicant.firstName} {applicant.lastName}
											</div>
										</Col>
										<Col span={24}>
											<div>
												<span className="font-bold">{t("back.reg.form.birthDate")}: </span>
												{dayjs(applicant.birthDate).format(SYS_DATE_FORMAT)}
											</div>
										</Col>
										<Col span={24}>
											<div>
												<span className="font-bold">{t("back.reg.form.email")}: </span>
												{applicant.email}
											</div>
										</Col>
										{applicant.phone && (
											<Col span={24}>
												<div>
													<span className="font-bold">{t("back.reg.form.phone")}: </span>
													{applicant.phone}
												</div>
											</Col>
										)}
									</Row>

									<Divider orientation="left">{t("back.reg.common.eventType")}</Divider>
									<Row gutter={[0, 8]}>
										<Col span={24}>
											<div>
												<span className="font-bold">{t("back.reg.common.type")}: </span>
												{applicant.eventTypeName}
											</div>
										</Col>
										{applicant.teamClub?.trim() ? (
											<Col span={24}>
												<div>
													<span className="font-bold">{t("back.reg.form.teamClub")}: </span>
													{applicant.teamClub}
												</div>
											</Col>
										) : null}
										<Col span={24}>
											<div>
												<span className="font-bold">{t("back.reg.form.ageGroup")}: </span>
												{applicant.ageGroupName || t("back.reg.form.noCompetitiveAgeGroup")}
											</div>
										</Col>
										{applicant.noShirt ? (
											<Col span={24}>
												<div>
													<span className="font-bold">{t("back.reg.payment.shirt")}: </span>{t("back.reg.payment.noReceive")}{' '}
													{(price > 0 && discount > 0) && (
														<span className="text-gray-500">
															({t("back.reg.common.discount")} {discount.toLocaleString()} {t("general.unitBaht")})
														</span>
													)}
												</div>
											</Col>
										) : (
											<>
												<Col span={24}>
													<div>
														<span className="font-bold">{t("back.reg.payment.shirtType")}: </span> {applicant.shirtTypeName}
													</div>
												</Col>
												<Col span={24}>
													{(applicant.shirtSizeChestSize || applicant.shirtSizeLength) ? (
														<div>
															<span className="font-bold">{t("back.reg.payment.shirtSize")}: </span> {applicant.shirtSizeName}
															{` ( ${t("back.reg.payment.chestSize")} : ${applicant.shirtSizeChestSize || "-"} ${t("back.reg.payment.lengthSize")} : ${applicant.shirtSizeLength || "-"} )`}
														</div>
													) : (
														<div>
															<span className="font-bold">{t("back.reg.payment.shirtSize")}: </span> {applicant.shirtSizeName}
														</div>
													)}
												</Col>
											</>
										)}
										<Col span={24}>
											<div>
												<span className="font-bold">{t("back.reg.common.price")}:</span>{' '}
												<span>
													{applicant.price.toLocaleString()} {t("general.unitBaht")}{' '}
													<span className="text-gray-500">
														({applicant.paymentName ? applicant.paymentName || t("general.unknown") : t("back.reg.common.normalPrice")})
													</span>
												</span>
											</div>
										</Col>
									</Row>

									<Divider orientation="left">{t("back.reg.payment.shipping")}</Divider>
									<Row gutter={[0, 8]}>
										<Col span={24}>
											<div>
												<span className="font-bold">{t("back.reg.payment.receiveMethod")}: </span>{' '}
												{applicant.deliveryMethod === 'post' ? t("back.reg.payment.post") : t("back.reg.payment.pickup")}
											</div>
										</Col>
										{applicant.deliveryMethod === 'post' && (
											<>
												<Col span={24}>
													<div>
														<span className="font-bold">{t("back.reg.payment.shippingFee")}: </span>{' '}
														<span>{deliveryFee} {t("general.unitBaht")}</span>
													</div>
												</Col>
												{(applicant.shippingAddress ||
													applicant.shippingDistrict ||
													applicant.shippingAmphoe ||
													applicant.shippingProvince ||
													applicant.shippingZipcode) && (
														<Col span={24}>
															<div>
																<span className="font-bold">{t("back.reg.payment.shippingAddress")}: </span>{" "}
																{formatAddress(
																	applicant.shippingAddress,
																	applicant.shippingDistrict,
																	applicant.shippingAmphoe,
																	applicant.shippingProvince,
																	applicant.shippingZipcode,
																	t
																)}
															</div>
														</Col>
													)}
											</>
										)}
									</Row>
									<Divider orientation="left"></Divider>
									<Row gutter={[16, 8]} justify="end" style={{ textAlign: 'right' }}>
										<Col span={12}>
											<div>{t("back.reg.common.price")}: </div>
										</Col>
										<Col span={6}>
											<div>{price.toLocaleString()} {t("general.unitBaht")}</div>
										</Col>

										{discount > 0 && (
											<>
												<Col span={12}>
													<div>{t("back.reg.common.discount")}: </div>
												</Col>
												<Col span={6}>
													<div className="text-danger">- {discount.toLocaleString()} {t("general.unitBaht")}</div>
												</Col>
											</>
										)}

										{deliveryFee > 0 && (
											<>
												<Col span={12}>
													<div>{t("back.reg.payment.shippingFee")}: </div>
												</Col>
												<Col span={6}>
													<div>{deliveryFee.toLocaleString()} {t("general.unitBaht")}</div>
												</Col>
											</>
										)}

										<Col span={12}>
											<div className="font-bold text-base">{t("back.reg.payment.total")}: </div>
										</Col>
										<Col span={6}>
											<div className="font-bold text-base text-primary">{total.toLocaleString()} {t("general.unitBaht")}</div>
										</Col>
									</Row>

								</Card>
							),
						};
					})}
				/>
				{/* รวมยอดทุกอย่าง */}
				<Row justify="end" className="mt-8">
					<Col>
						<div className="p-4 min-w-[320px] text-sm text-gray-800">
							<div className="flex justify-between mb-3 font-semibold">
								<span>{t("back.reg.payment.totalApplicants")}</span>
								<span>
									{applicants.length}{" "}
									{t(applicants.length > 1 ? "back.reg.common.persons" : "back.reg.common.person")}
								</span>
							</div>
							<div className="flex justify-between mb-2">
								<span>{t("back.reg.payment.totalFee")}</span>
								<span className="font-semibold">{totalEventType.toLocaleString()} {t("general.unitBaht")}</span>
							</div>
							<div className="flex justify-between mb-2">
								<span>{t("back.reg.payment.discountNoShirt")}</span>
								<span className="font-semibold text-danger">-{totalDiscount.toLocaleString()} {t("general.unitBaht")}</span>
							</div>
							<div className="flex justify-between mb-3">
								<span>{t("back.reg.payment.totalShippingFee")}</span>
								<span className="font-semibold">{totalShipping.toLocaleString()} {t("general.unitBaht")}</span>
							</div>
							<Divider style={{ margin: '12px 0' }} />
							<div className="flex justify-between text-lg font-bold">
								<span>{t("back.reg.payment.grandTotal")}</span>
								<span className="text-primary">{grandTotal.toLocaleString()} {t("general.unitBaht")}</span>
							</div>
						</div>
					</Col>
				</Row>
				{order?.eventConditions?.length > 0 && (
					<>
						<div className="text-base font-semibold text-gray-800 my-2">{t("back.reg.payment.checkBeforePay")}</div>
						<Checkbox.Group
							options={checkboxOptions}
							onChange={handleCheckboxChange}
							style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}
						/>
					</>
				)}
				<Row justify="space-between">
					<Col>
						{!order?.orderNo && (
							<Button onClick={() => navigate(`/registrationInfo/${order?.eventId}`)}>
								{t("general.back")}
							</Button>
						)}
					</Col>
					<Col>
						<Button
							type="primary"
							disabled={
								isSubmitting ||
								(order?.eventConditions?.length > 0
									? checkedValues.length !== checkboxOptions.length
									: false)
							}
							style={{ backgroundColor: "#FFB946", borderColor: "#FFB946" }}
							onClick={processOrder}
							loading={isSubmitting}
						>
							{t("general.next")}
						</Button>
					</Col>
				</Row>
			</div>
		</FrontLayout>
	);
};

export default RegistrationDetail;
