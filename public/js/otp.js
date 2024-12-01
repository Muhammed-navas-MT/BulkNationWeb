document.addEventListener('DOMContentLoaded', function() {
  const inputs = document.querySelectorAll('.otp-input');
  const submitBtn = document.querySelector('.submit-btn');

  
  inputs.forEach((input, index) => {
      input.addEventListener('input', function() {
          if (this.value.length === 1) {
              if (index < inputs.length - 1) {
                  inputs[index + 1].focus();
              }
          }
      });

      input.addEventListener('keydown', function(e) {
          if (e.key === 'Backspace' && !this.value && index > 0) {
              inputs[index - 1].focus();
          }
      });
  });

  submitBtn.addEventListener('click', function() {
      const otp = Array.from(inputs).map(input => input.value).join('');
      if (otp.length === 4) {
          console.log('OTP Submitted:', otp);
          // Add your verification logic here
      }
  });
  
});


function validateOTPForm() {
    // Merge all input values into a single string
    const otpString = 
        document.getElementById('otp1').value +
        document.getElementById('otp2').value +
        document.getElementById('otp3').value +
        document.getElementById('otp4').value;

    if (otpString.length !== 4) {
        Swal.fire({
            icon: "warning",
            title: "Incomplete OTP",
            text: "Please enter all 4 digits of the OTP."
        });
        return false;
    }

    // Send the OTP as a single value
    $.ajax({
        type: "POST",
        url: "/otp",
        data: { otp: otpString },
        success: function (res) {
            if (res.success) {
                Swal.fire({
                    title: 'OTP Submitted!',
                    text: `Your OTP is: ${otpString}`,
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    window.location.href = res.redirectUrl;
                });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: res.message,
                    icon: 'error',
                });
            }
        },
        error: function () {
            Swal.fire({
                icon: "error",
                title: "Invalid OTP",
                text: "Please try again"
            });
        }
    });
    return false; // Prevent form submission
}