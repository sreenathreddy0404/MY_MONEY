export const ok = (res, data, extra = {}, status = 200) => res.status(status).json({ success: true, data, ...extra })
export const created = (res, data) => ok(res, data, {}, 201)
