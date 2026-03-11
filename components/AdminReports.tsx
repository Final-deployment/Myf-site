import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Users, Mic2, Clock, Download, Calendar, ArrowUpRight, ArrowDownRight, Printer } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { api } from '../services/api';

const AdminReports: React.FC = () => {
    // Dynamic Data Calculation
    const [users, setUsers] = React.useState<any[]>([]);
    const [courses, setCourses] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersData, coursesData] = await Promise.all([
                    api.getUsers(),
                    api.getCourses()
                ]);
                setUsers(Array.isArray(usersData) ? usersData : []);
                setCourses(Array.isArray(coursesData) ? coursesData : []);
            } catch (error) {
                console.error("Failed to fetch report data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
    // 1. KPI Calculations
    const totalStudents = users.filter(u => u.role === 'student').length;

    const completionRate = useMemo(() => {
        if (!courses || courses.length === 0) return 0;
        const totalProgress = courses.reduce((acc, c) => acc + (c.progress || 0), 0);
        return Math.round(totalProgress / courses.length);
    }, [courses]);

    // 2. Course Distribution
    const courseDistribution = useMemo(() => {
        const dist: Record<string, number> = {};
        courses.forEach(c => {
            const cat = c.category || 'أخرى';
            dist[cat] = (dist[cat] || 0) + 1;
        });
        const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#6b7280'];
        return Object.keys(dist).map((key, index) => ({
            name: key,
            value: dist[key],
            color: colors[index % colors.length]
        }));
    }, [courses]);

    // 3. Top Courses
    const topCourses = useMemo(() => {
        return [...courses]
            .sort((a, b) => (b.studentsCount || 0) - (a.studentsCount || 0))
            .slice(0, 5)
            .map(c => ({
                name: c.title,
                students: c.studentsCount || 0,
                growth: Math.floor(Math.random() * 20) - 5 // Mock growth
            }));
    }, [courses]);

    // KPIs array (depends on completionRate)
    const kpis = [
        { label: 'معدل إكمال الدورات', value: `${completionRate}%`, change: '+5%', trend: 'up' as const, icon: TrendingUp },
        { label: 'متوسط وقت الدراسة', value: '45 د', change: '+12%', trend: 'up' as const, icon: Clock },
        { label: 'رضا الطلاب', value: '4.8/5', change: '+0.2', trend: 'up' as const, icon: Users },
        { label: 'معدل التسرب', value: '2%', change: '-2%', trend: 'down' as const, icon: TrendingDown },
    ];

    // 4. Monthly Data (Mocked but scalable)
    const baseCount = Math.max(users.length, 100);
    const monthlyData = [
        { month: 'يناير', students: Math.max(0, baseCount - 50), courses: 5, hours: 450 },
        { month: 'فبراير', students: Math.max(0, baseCount - 40), courses: 8, hours: 620 },
        { month: 'مارس', students: Math.max(0, baseCount - 30), courses: 12, hours: 890 },
        { month: 'أبريل', students: Math.max(0, baseCount - 20), courses: 15, hours: 1100 },
        { month: 'مايو', students: Math.max(0, baseCount - 10), courses: 18, hours: 1450 },
        { month: 'يونيو', students: baseCount, courses: courses.length || 20, hours: 1800 },
    ];

    // NOW the conditional return is safe - after all hooks
    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;
    }

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        const reportData = {
            generatedAt: new Date().toISOString(),
            kpis,
            courseDistribution,
            topCourses,
            monthlyData
        };
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="animate-fade-in space-y-6 print:space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center print:hidden">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">التقارير والإحصائيات</h2>
                    <p className="text-gray-300">تحليلات شاملة لأداء المنصة</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                        <Printer className="w-5 h-5" />
                        <span>طباعة</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        <span>تصدير</span>
                    </button>
                </div>
            </div>

            {/* Print Header (Visible only in print) */}
            <div className="hidden print:block text-center mb-8">
                <h1 className="text-2xl font-bold text-black mb-2">تقرير منصة المصطبة العلمية</h1>
                <p className="text-gray-600">{new Date().toLocaleDateString('ar-SA')}</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
                {kpis.map((kpi, idx) => (
                    <div key={idx} className="glass-panel p-5 rounded-2xl print:border print:border-gray-200 print:bg-white">
                        <div className="flex items-start justify-between mb-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.trend === 'up' ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                                }`}>
                                <kpi.icon className={`w-5 h-5 ${kpi.trend === 'up' ? 'text-emerald-400' : 'text-amber-400'} print:text-black`} />
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-medium ${kpi.trend === 'up' ? 'text-emerald-400' : 'text-amber-400'
                                } print:text-black`}>
                                {kpi.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                {kpi.change}
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-white mb-1 print:text-black">{kpi.value}</p>
                        <p className="text-gray-400 text-sm print:text-gray-600">{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-2">
                {/* Growth Chart */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl print:border print:border-gray-200 print:text-black print:bg-white">
                    <h3 className="text-xl font-bold text-white mb-6 print:text-black">نمو الطلاب الشهري</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="month" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: '#fff'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="students"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorStudents)"
                                    name="الطلاب"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Course Distribution */}
                <div className="glass-panel p-6 rounded-2xl print:border print:border-gray-200 print:bg-white">
                    <h3 className="text-xl font-bold text-white mb-6 print:text-black">توزيع الدورات</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={courseDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {courseDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Legend
                                    formatter={(value) => <span className="text-gray-300 print:text-black">{value}</span>}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: '#fff'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top Courses */}
            <div className="glass-panel p-6 rounded-2xl print:border print:border-gray-200 print:bg-white">
                <h3 className="text-xl font-bold text-white mb-6 print:text-black">أكثر الدورات شعبية</h3>
                <div className="space-y-4">
                    {topCourses.map((course, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors print:border print:border-gray-100 print:bg-gray-50">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                                {idx + 1}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-medium print:text-black">{course.name}</h4>
                                <p className="text-gray-400 text-sm print:text-gray-600">{course.students} طالب</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden print:bg-gray-200">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                        style={{ width: `${(course.students / (topCourses[0].students || 1)) * 100}%` }}
                                    />
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-medium ${course.growth >= 0 ? 'text-emerald-400' : 'text-red-400'
                                    }`}>
                                    {course.growth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                    {Math.abs(course.growth)}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
