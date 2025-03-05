import { loginByPassword, getAccessToken, pushBandData, isWorkday } from "./api.js";
import { isEmpty } from "./common.js";
import * as log from "./log.js";
import dayjs from "dayjs";

export async function run(config) {
  const currentDate = new Date();
  const workday = await isWorkday(currentDate);
  log.info(`isworkday:${workday}`);
  if (!workday) return;
  if (isEmpty(config.app_token) || isEmpty(config.user_id)) {
    log.warn("未获取到APP_TOKEN或USER_ID 将使用账号密码方式运行");
    const code = await loginByPassword(config.username, config.password);
    const { app_token, user_id } = await getAccessToken(code);

    config.app_token = app_token;
    config.user_id = user_id;
  }
  const hour = dayjs().hour();
  const progress = hour < 11 ? 0.3 : hour < 14 ? 0.6 : 1; // 判断当前时期
  const finalStep = getRamdomStep(config.step_size) * progress;
  await pushBandData(finalStep, config.user_id, config.app_token);
}

function getRamdomStep(step_size = DEFAULT_STEP_SIZE) {
  if (!step_size.includes("-")) throw new Error("步数范围格式异常");

  const temp = step_size.split("-");
  if (temp.length !== 2) return getRamdomStep();

  const min = new Number(temp[0]);
  const max = new Number(temp[1]);
  const step = parseInt(min + Math.random() * (max - min));
  log.info(`在 [${min} 至 ${max}] 范围内随机步数 step: ${step}`);
  return step;
}
