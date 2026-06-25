import { useEffect, useState } from 'react';
import { Checkbox, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import FrontLayout from 'components/frontLayout';
import RegistrationSteps from '../components/RegistrationSteps';
import backOfficeServices from "services/backoffice.services";
import { AlertError, AlertWarning } from 'components/alert';
import dayjs from 'dayjs';
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

// Small presentational helpers so the review card reads like the registration
// form (orange-accented section heading + label/value rows), responsive by default.
const DetailSection = ({ title, children }) => (
	<div className="space-y-1.5">
		<h4 className="text-xs font-bold uppercase tracking-wide text-[#006193] border-l-2 border-[#fe9400] pl-2 mb-2">
			{title}
		</h4>
		{children}
	</div>
);

const DetailRow = ({ label, children }) => (
	<div className="flex flex-wrap gap-x-2 text-sm leading-relaxed">
		<span className="font-bold text-[#3f4850]">{label}:</span>
		<span className="text-[#181c1e] break-words">{children}</span>
	</div>
);

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
				message.error("ไม่พบอีเมลสำหรับส่งยืนยัน / No email found for confirmation");
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
				message.success("สร้างคำสั่งซื้อสำเร็จ! กำลังไปหน้าชำระเงิน... / Order created! Redirecting to payment...");
			} catch (err) {
				console.error("ส่งอีเมลล้มเหลว:", err);
				message.error("สร้างคำสั่งซื้อสำเร็จ แต่ไม่สามารถส่งอีเมลได้ / Order created, but the confirmation email could not be sent");
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
		<FrontLayout fullWidth>
			<RegistrationSteps currentStep={1} />
			<div className="bg-[#f7fafc] min-h-screen pb-12">
				<div className="max-w-screen-md lg:max-w-screen-lg mx-auto px-4 py-6">
					{/* event header */}
					<div className="mb-6 border-l-4 border-[#fe9400] pl-4">
						<h2 className="text-2xl font-bold text-[#181c1e] mb-1">
							{eventData?.name || applicants[0]?.eventName || t("back.reg.common.applicantInfo")}
						</h2>
						<p className="text-sm font-bold text-[#3f4850] flex items-center gap-2">
							📋 {t("back.reg.common.applicantInfo")} / Review &amp; Confirm
						</p>
					</div>

					<div className="grid gap-6 lg:grid-cols-3 items-start">
						{/* ---- left: applicant review cards ---- */}
						<div className="lg:col-span-2 space-y-4">
							{applicants.map((applicant, idx) => {
								const price = Number(applicant.price || 0);
								const discount = Number(applicant.discountNoShirt || 0);
								const deliveryFee = applicant.deliveryMethod === 'post' ? applicant.shippingFee : 0;
								const total = (price - discount) + deliveryFee;
								return (
									<div key={idx} className="bg-white border border-[#bfc7d2] rounded-xl overflow-hidden shadow-sm">
										<div className="flex items-center justify-between gap-2 px-5 py-3 bg-[#f1f4f6] border-b border-[#e5e9eb]">
											<span className="font-bold text-[#181c1e]">
												👤 {t("back.reg.common.applicantNumber")} {idx + 1}/{applicants.length}
												<span className="text-[#3f4850] font-normal ml-1">
													({applicant.firstName} {applicant.lastName})
												</span>
											</span>
											<span className="text-[#006193] font-bold whitespace-nowrap">
												{total.toLocaleString()} {t("general.unitBaht")}
											</span>
										</div>

										<div className="p-5 space-y-5">
											<DetailSection title={t("back.reg.common.applicantInfo")}>
												<DetailRow label={t("back.reg.form.firstName")}>{applicant.firstName} {applicant.lastName}</DetailRow>
												<DetailRow label={t("back.reg.form.birthDate")}>{dayjs(applicant.birthDate).format(SYS_DATE_FORMAT)}</DetailRow>
												<DetailRow label={t("back.reg.form.email")}>{applicant.email}</DetailRow>
												{applicant.phone ? <DetailRow label={t("back.reg.form.phone")}>{applicant.phone}</DetailRow> : null}
											</DetailSection>

											<DetailSection title={t("back.reg.common.eventType")}>
												<DetailRow label={t("back.reg.common.type")}>{applicant.eventTypeName}</DetailRow>
												{applicant.teamClub?.trim() ? <DetailRow label={t("back.reg.form.teamClub")}>{applicant.teamClub}</DetailRow> : null}
												<DetailRow label={t("back.reg.form.ageGroup")}>{applicant.ageGroupName || t("back.reg.form.noCompetitiveAgeGroup")}</DetailRow>
												{applicant.noShirt ? (
													<DetailRow label={t("back.reg.payment.shirt")}>
														{t("back.reg.payment.noReceive")}
														{(price > 0 && discount > 0) ? (
															<span className="text-[#3f4850]"> ({t("back.reg.common.discount")} {discount.toLocaleString()} {t("general.unitBaht")})</span>
														) : null}
													</DetailRow>
												) : (
													<>
														<DetailRow label={t("back.reg.payment.shirtType")}>{applicant.shirtTypeName}</DetailRow>
														<DetailRow label={t("back.reg.payment.shirtSize")}>
															{applicant.shirtSizeName}
															{(applicant.shirtSizeChestSize || applicant.shirtSizeLength)
																? ` ( ${t("back.reg.payment.chestSize")} : ${applicant.shirtSizeChestSize || "-"} ${t("back.reg.payment.lengthSize")} : ${applicant.shirtSizeLength || "-"} )`
																: ""}
														</DetailRow>
													</>
												)}
												<DetailRow label={t("back.reg.common.price")}>
													{applicant.price.toLocaleString()} {t("general.unitBaht")}
													<span className="text-[#3f4850]"> ({applicant.paymentName || t("back.reg.common.normalPrice")})</span>
												</DetailRow>
											</DetailSection>

											<DetailSection title={t("back.reg.payment.shipping")}>
												<DetailRow label={t("back.reg.payment.receiveMethod")}>
													{applicant.deliveryMethod === 'post' ? t("back.reg.payment.post") : t("back.reg.payment.pickup")}
												</DetailRow>
												{applicant.deliveryMethod === 'post' ? (
													<>
														<DetailRow label={t("back.reg.payment.shippingFee")}>{deliveryFee} {t("general.unitBaht")}</DetailRow>
														{(applicant.shippingAddress || applicant.shippingDistrict || applicant.shippingAmphoe || applicant.shippingProvince || applicant.shippingZipcode) ? (
															<DetailRow label={t("back.reg.payment.shippingAddress")}>
																{formatAddress(applicant.shippingAddress, applicant.shippingDistrict, applicant.shippingAmphoe, applicant.shippingProvince, applicant.shippingZipcode, t)}
															</DetailRow>
														) : null}
													</>
												) : null}
											</DetailSection>

											<div className="border-t border-[#e5e9eb] pt-3 space-y-1 text-sm">
												<div className="flex justify-between"><span className="text-[#3f4850]">{t("back.reg.common.price")}</span><span>{price.toLocaleString()} {t("general.unitBaht")}</span></div>
												{discount > 0 ? <div className="flex justify-between"><span className="text-[#3f4850]">{t("back.reg.common.discount")}</span><span className="text-[#ba1a1a]">- {discount.toLocaleString()} {t("general.unitBaht")}</span></div> : null}
												{deliveryFee > 0 ? <div className="flex justify-between"><span className="text-[#3f4850]">{t("back.reg.payment.shippingFee")}</span><span>{deliveryFee.toLocaleString()} {t("general.unitBaht")}</span></div> : null}
												<div className="flex justify-between font-bold pt-1"><span>{t("back.reg.payment.total")}</span><span className="text-[#006193]">{total.toLocaleString()} {t("general.unitBaht")}</span></div>
											</div>
										</div>
									</div>
								);
							})}
						</div>

						{/* ---- right: order summary + confirm ---- */}
						<aside className="lg:col-span-1">
							<div className="lg:sticky lg:top-6 space-y-4">
								<div className="bg-white border border-[#bfc7d2] rounded-xl shadow-sm p-5">
									<h3 className="font-bold text-[#181c1e] mb-4">{t("back.reg.payment.grandTotal")}</h3>
									<div className="space-y-2 text-sm">
										<div className="flex justify-between"><span className="text-[#3f4850]">{t("back.reg.payment.totalApplicants")}</span><span className="font-bold">{applicants.length} {t(applicants.length > 1 ? "back.reg.common.persons" : "back.reg.common.person")}</span></div>
										<div className="flex justify-between"><span className="text-[#3f4850]">{t("back.reg.payment.totalFee")}</span><span className="font-bold">{totalEventType.toLocaleString()} {t("general.unitBaht")}</span></div>
										{totalDiscount > 0 ? <div className="flex justify-between"><span className="text-[#3f4850]">{t("back.reg.payment.discountNoShirt")}</span><span className="font-bold text-[#ba1a1a]">-{totalDiscount.toLocaleString()} {t("general.unitBaht")}</span></div> : null}
										<div className="flex justify-between"><span className="text-[#3f4850]">{t("back.reg.payment.totalShippingFee")}</span><span className="font-bold">{totalShipping.toLocaleString()} {t("general.unitBaht")}</span></div>
									</div>
									<div className="border-t border-[#e5e9eb] mt-3 pt-3 flex justify-between items-center">
										<span className="font-bold text-[#181c1e]">{t("back.reg.payment.grandTotal")}</span>
										<span className="text-2xl font-bold text-[#006193]">{grandTotal.toLocaleString()} {t("general.unitBaht")}</span>
									</div>
								</div>

								{order?.eventConditions?.length > 0 ? (
									<div className="bg-white border border-[#bfc7d2] rounded-xl shadow-sm p-5">
										<div className="font-bold text-[#181c1e] mb-3">{t("back.reg.payment.checkBeforePay")}</div>
										<Checkbox.Group options={checkboxOptions} value={checkedValues} onChange={handleCheckboxChange}
											style={{ display: 'flex', flexDirection: 'column', gap: 10 }} />
									</div>
								) : null}

								<div className="flex flex-col gap-3">
									<button type="button" onClick={processOrder}
										disabled={isSubmitting || (order?.eventConditions?.length > 0 ? checkedValues.length !== checkboxOptions.length : false)}
										className="w-full bg-[#fe9400] text-[#633700] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
										{isSubmitting ? <LoadingOutlined /> : null}
										{t("general.next")}
									</button>
									{!order?.orderNo ? (
										<button type="button" onClick={() => navigate(`/registrationInfo/${order?.eventId}`)}
											className="w-full bg-white border border-[#bfc7d2] text-[#3f4850] font-bold py-3 rounded-xl hover:border-[#006193] transition-all">
											{t("general.back")}
										</button>
									) : null}
								</div>
							</div>
						</aside>
					</div>
				</div>
			</div>
		</FrontLayout>
	);
};

export default RegistrationDetail;
