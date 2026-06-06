import { COLOR } from "constants/color";
import Swal from "sweetalert2";

export const AlertError = ({
  text = " ",
  title = "ไม่สามารถดำเนินการได้!",
  confirmButtonText = "ตกลง",
  onOk = () => { },
}) => {
  Swal.fire({
    title: title,
    text: text,
    icon: "error",
    confirmButtonText,
    confirmButtonColor: COLOR.primary,
    allowOutsideClick: false,
    allowEscapeKey: false,
  }).then((result) => {
    if (result.isConfirmed) {
      onOk();
    }
  });
};
export const AlertWarning = ({
  text = " ",
  title = "ไม่สามารถดำเนินการได้!",
  confirmButtonText = "ตกลง",
  onOk = () => { },
}) => {
  Swal.fire({
    title: title,
    text: text,
    icon: "warning",
    confirmButtonText,
    confirmButtonColor: COLOR.primary,
    allowOutsideClick: false,
    allowEscapeKey: false,
  }).then((result) => {
    if (result.isConfirmed) {
      onOk();
    }
  });
};
export const AlertSuccess = ({
  text = " ",
  title = "ดำเนินการสำเร็จ!",
  confirmButtonText = "ตกลง",
  onOk = () => { },
}) => {
  Swal.fire({
    title: title,
    text: text,
    icon: "success",
    confirmButtonText,
    confirmButtonColor: COLOR.primary,
    allowOutsideClick: false,
    allowEscapeKey: false,
  }).then((result) => {
    if (result.isConfirmed) {
      onOk();
    }
  });
};
export const AlertSuccessLogin = ({
  text = " ",
  title = "เข้าสู่ระบบสำเร็จ!",
  timer = 1000,
}) => {
  Swal.fire({
    title,
    text,
    icon: "success",
    showConfirmButton: false,
    timer,
    timerProgressBar: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
  });
};

export const AlertConfirm = ({
  text = "ยืนยันการทำรายการ",
  title = "คุณต้องการทำรายการหรือไม่?",
  onOk = () => { },
  confirmButtonText = "ตกลง",
  cancelButtonText = "ยกเลิก",
}) => {
  Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: COLOR.primary,
    cancelButtonColor: "#d33",
    confirmButtonText,
    cancelButtonText,
  }).then((result) => {
    if (result.isConfirmed) {
      onOk();
    }
  });
};

export const AlertLoading = ({ title = "กรุณารอสักครู่...", text = " " }) => {
  Swal.fire({
    title,
    text,
    timerProgressBar: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
    willClose: () => true,
  }).then(() => {
    /* Read more about handling dismissals below */
  });
};

export const AlertUpdateLoading = ({
  title = "กรุณารอสักครู่...",
  percent = 0,
}) => {
  Swal.update({
    title,
    html: `<div>
        <p style="margin: 8px 0px">กำลังอัปโหลดไฟล์... ${percent}%</p>
        <div class="progress">
            <div class="progress-bar" role="progressbar" style="width: ${percent}%;"
                aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
            </div>
        </div>
    </div>`,
    timerProgressBar: true,
  });
};

export const AlertClosed = () => {
  Swal.close();
};
