function objToStr(obj) {}

function solution(S, K) {
  let last_letter = S[0];
  let letters = [];
  let formatted_letters = {};

  for (let i = 0; i <= S.length; i++) {
    if (last_letter == S[i]) {
      letters.push(S[i]);
    } else {
      if (typeof formatted_letters[S[i - 1]] != "undefined") {
        formatted_letters[S[i - 1]] += letters.length;
      } else {
        formatted_letters[S[i - 1]] = letters.length;
      }
      // cllear letters
      letters = [];
      last_letter = S[i];

      letters.push(S[i]);
    }
  }
  let compressed_letters = "";
  for (let letter in formatted_letters) {
    let length = formatted_letters[letter];
    if (true) {
      if (length > 1) {
        compressed_letters += length + letter;
      } else {
        compressed_letters += letter;
      }
    }
  }
  return compressed_letters;
}

// console.log(solution("AAAAAAAAAAABXXAAAAAAAAAA", 3));
console.log(solution("ABBBCCDDCCC", 3));
