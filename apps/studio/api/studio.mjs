import {createStudioHandler} from '../src/handler.mjs';
export default {fetch:createStudioHandler(process.env)};
