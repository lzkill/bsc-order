const emoji = require('node-emoji');

export function formatWelcomeMessage() {
  const prefix = `${emoji.get(':dollar:')} `;
  return `${prefix}Welcome to the ${bold('Biscoint Scheduled Order Bot')}!`;
}

export function formatHelpMessage() {
  const prefix = emoji.get(':bulb:');
  return `${prefix}${bold('Available commands:')}

  - /bob_start nothing really useful
  - /bob_enable enable the service
  - /bob_disable disable the service
  - /bob_config get the service config
  - /bob_ping pong back
  - /bob_help show this message`;
}

export function formatServiceEnabledMessage() {
  const message = 'Service enabled';
  return formatGeneralInfoMessage(message);
}

export function formatServiceDisabledMessage() {
  const message = 'Service disabled';
  return formatGeneralInfoMessage(message);
}

export function formatPingMessage() {
  const message = 'Pong';
  return formatGeneralInfoMessage(message);
}

export function formatGeneralInfoMessage(message: string) {
  const prefix = emoji.get(':grey_exclamation:');
  return `${prefix}${message}`;
}

function bold(text: string) {
  return `<b>${text}</b>`;
}
